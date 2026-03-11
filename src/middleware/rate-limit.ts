import type { RequestHandler } from "express";
import type { CacheProvider } from "../provider/cache";
import { sendProblem } from "../utils/problem";

function getClientKey(req: Parameters<RequestHandler>[0]): string {
  const apiKey = req.header("x-api-key");
  if (apiKey) return `apikey:${apiKey}`;

  const forwarded = req.header("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0]?.trim() ?? "unknown"}`;

  return `ip:${req.ip ?? "unknown"}`;
}

export function createRateLimitMiddleware(deps: {
  cache: CacheProvider;
  max: number;
  windowSec: number;
  keyPrefix: string;
}): RequestHandler {
  return async (req, res, next) => {
    const bucket = Math.floor(Date.now() / (deps.windowSec * 1000));
    const key = `${deps.keyPrefix}:${getClientKey(req)}:${bucket}`;

    const currentRaw = await deps.cache.get(key);
    const current = currentRaw ? Number(currentRaw) : 0;
    const nextCount = current + 1;

    await deps.cache.set(key, String(nextCount), deps.windowSec);

    const remaining = Math.max(0, deps.max - nextCount);
    res.setHeader("x-ratelimit-limit", String(deps.max));
    res.setHeader("x-ratelimit-remaining", String(remaining));
    res.setHeader("x-ratelimit-window-sec", String(deps.windowSec));

    if (nextCount > deps.max) {
      res.setHeader("retry-after", String(deps.windowSec));
      return sendProblem(req, res, {
        title: "Too Many Requests",
        status: 429,
        detail: "Rate limit exceeded",
        requestId: res.locals.requestId,
      });
    }

    return next();
  };
}
