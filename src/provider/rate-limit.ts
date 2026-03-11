import { createRateLimitMiddleware } from "../middleware/rate-limit";
import { cache } from "./cache";
import { env } from "./config";

export function createGlobalRateLimiter() {
  return createRateLimitMiddleware({
    cache,
    max: env.GLOBAL_RATE_LIMIT_MAX,
    windowSec: env.GLOBAL_RATE_LIMIT_WINDOW_SEC,
    keyPrefix: "rl:global",
  });
}

export function createAuthRateLimiter() {
  return createRateLimitMiddleware({
    cache,
    max: env.AUTH_RATE_LIMIT_MAX,
    windowSec: env.AUTH_RATE_LIMIT_WINDOW_SEC,
    keyPrefix: "rl:auth",
  });
}
