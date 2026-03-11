import { app } from "./app";
import { cache } from "./provider/cache";
import { env } from "./provider/config";
import { db } from "./provider/db";
import { logger } from "./provider/logger";

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info("server.started", {
    host: env.HOST,
    port: env.PORT,
  });
});

async function shutdown(signal: string): Promise<void> {
  logger.info("server.shutdown", { signal });
  server.close();

  if ("close" in db && typeof db.close === "function") {
    await db.close();
  }

  if (cache.close) {
    await cache.close();
  }

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
