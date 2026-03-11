import { createAuthMiddleware } from "./middleware/auth";
import { env } from "./provider/config";
import { attachDefaultErrorHandlers, createExpressApp } from "./provider/express";
import { createAppHealthRouter } from "./provider/health";
import { logger } from "./provider/logger";
import { createAuthRateLimiter, createGlobalRateLimiter } from "./provider/rate-limit";
import { authRepo } from "./repo/auth";
import { authRouter } from "./routes/auth";
import { exampleRouter } from "./routes/example";
import { usersRouter } from "./routes/users";

export const app = createExpressApp(
  {
    bodyLimitBytes: env.BODY_LIMIT_BYTES,
    trustProxy: env.TRUST_PROXY,
  },
  logger,
);

const globalRateLimiter = createGlobalRateLimiter();
const authRateLimiter = createAuthRateLimiter();
const healthRouter = createAppHealthRouter();

app.use("/healthz", healthRouter);
app.use("/api/v1", globalRateLimiter);
app.use("/api/v1/auth", authRateLimiter, authRouter);
app.use("/api/v1/users", createAuthMiddleware({ repo: authRepo }), usersRouter);
app.use("/api/v1/example", exampleRouter);

attachDefaultErrorHandlers(app, {
  logger,
  isProduction: env.NODE_ENV === "production",
});
