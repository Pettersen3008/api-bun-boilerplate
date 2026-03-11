import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { createRequestLoggingMiddleware } from "../middleware/request-logging";
import { createJsonContentTypeMiddleware, createSecurityHeadersMiddleware } from "../middleware/security";
import { sendProblem } from "../utils/problem";
import type { Logger } from "./logger";

type ExpressBaseConfig = {
  bodyLimitBytes: number;
  trustProxy: boolean | string;
};

export function createExpressApp(config: ExpressBaseConfig, logger: Logger): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);

  app.use(createRequestLoggingMiddleware(logger));
  app.use(createSecurityHeadersMiddleware());
  app.use(createJsonContentTypeMiddleware());
  app.use(express.json({ limit: config.bodyLimitBytes }));

  return app;
}

export function attachDefaultErrorHandlers(app: Express, deps: { logger: Logger; isProduction: boolean }): void {
  app.use((req: Request, res: Response) => {
    return sendProblem(req, res, {
      status: 404,
      detail: `Route ${req.method} ${req.path} not found`,
      requestId: res.locals.requestId,
    });
  });

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    const typedError = error as { type?: string; status?: number; stack?: string; message?: string };

    deps.logger.error("request.failed", {
      requestId: res.locals.requestId,
      errorType: typedError.type,
      errorStatus: typedError.status,
      errorMessage: typedError.message ?? String(error),
      stack: deps.isProduction ? undefined : typedError.stack,
    });

    if (typedError.type === "entity.too.large") {
      return sendProblem(req, res, {
        status: 413,
        detail: "Request body exceeds max size",
        requestId: res.locals.requestId,
      });
    }

    if (typedError.status === 400) {
      return sendProblem(req, res, {
        status: 400,
        detail: "Invalid JSON payload",
        requestId: res.locals.requestId,
      });
    }

    return sendProblem(req, res, {
      status: 500,
      detail: deps.isProduction ? "Unexpected server error" : String(error),
      requestId: res.locals.requestId,
    });
  });
}
