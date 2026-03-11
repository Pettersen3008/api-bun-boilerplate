import { Router } from "express";

type HealthDeps = {
  pingDb: () => Promise<void>;
  pingCache?: () => Promise<void>;
};

export function createHealthRouter(deps: HealthDeps): Router {
  const router = Router();

  // Liveness only: process is up.
  router.get("/", (_req, res) => {
    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: { app: "ok" },
    });
  });

  // Readiness: dependencies are available.
  router.get("/readyz", async (_req, res) => {
    let dbOk = false;
    let cacheOk: boolean | "skipped" = "skipped";

    try {
      await deps.pingDb();
      dbOk = true;
    } catch {
      dbOk = false;
    }

    if (deps.pingCache) {
      try {
        await deps.pingCache();
        cacheOk = true;
      } catch {
        cacheOk = false;
      }
    }

    const ready = dbOk && (cacheOk === true || cacheOk === "skipped");

    return res.status(ready ? 200 : 503).json({
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      services: {
        db: dbOk ? "ok" : "down",
        cache: cacheOk === "skipped" ? "skipped" : cacheOk ? "ok" : "down",
      },
    });
  });

  return router;
}
