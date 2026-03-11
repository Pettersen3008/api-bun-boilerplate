import { Router } from "express";

type HealthDeps = {
  pingDb: () => Promise<void>;
};

export function createHealthRouter(deps: HealthDeps): Router {
  const router = Router();

  router.get("/", async (_req, res) => {
    try {
      await deps.pingDb();
      return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        services: { db: "ok" },
      });
    } catch {
      return res.status(503).json({
        status: "degraded",
        timestamp: new Date().toISOString(),
        services: { db: "down" },
      });
    }
  });

  return router;
}
