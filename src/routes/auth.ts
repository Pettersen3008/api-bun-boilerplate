import { Router } from "express";
import { ZodError } from "zod";
import { env } from "../provider/config";
import { logger } from "../provider/logger";
import { authRepo, type IAuthRepo } from "../repo/auth";
import { LoginSchema, RegisterSchema } from "../request/auth";
import { sendProblem } from "../utils/problem";
import { generateOpaqueToken, hashPassword, sha256Hex, verifyPassword } from "../utils/security";
import { zodErrorToFieldMap } from "../utils/validation";
import { createAuthMiddleware } from "../middleware/auth";

export function createAuthRouter(deps: { repo: IAuthRepo }): Router {
  const router = Router();
  const requireAuth = createAuthMiddleware({ repo: deps.repo });

  router.post("/register", async (req, res, next) => {
    try {
      const payload = RegisterSchema.parse(req.body);
      const passwordHash = await hashPassword(payload.password);
      const user = await deps.repo.createUserWithPassword({
        email: payload.email,
        fullName: payload.fullName,
        passwordHash,
      });

      logger.info("auth.register.success", {
        requestId: res.locals.requestId,
        userId: user.id,
      });

      return res.status(201).json({
        data: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return sendProblem(req, res, {
          title: "Unprocessable Entity",
          status: 422,
          detail: "Validation failed",
          errors: zodErrorToFieldMap(error),
          requestId: res.locals.requestId,
        });
      }

      const maybePgError = error as { code?: string };
      if (maybePgError.code === "23505") {
        return sendProblem(req, res, {
          title: "Conflict",
          status: 409,
          detail: "User already exists",
          requestId: res.locals.requestId,
        });
      }

      return next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const payload = LoginSchema.parse(req.body);
      const user = await deps.repo.findUserByEmail(payload.email);

      if (!user?.password_hash) {
        return sendProblem(req, res, {
          title: "Unauthorized",
          status: 401,
          detail: "Invalid credentials",
          requestId: res.locals.requestId,
        });
      }

      const valid = await verifyPassword(payload.password, user.password_hash);
      if (!valid) {
        return sendProblem(req, res, {
          title: "Unauthorized",
          status: 401,
          detail: "Invalid credentials",
          requestId: res.locals.requestId,
        });
      }

      const token = generateOpaqueToken();
      const tokenHash = await sha256Hex(token);
      const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);

      await deps.repo.createSession({
        userId: user.id,
        tokenHash,
        expiresAtIso: expiresAt.toISOString(),
      });

      logger.info("auth.login.success", {
        requestId: res.locals.requestId,
        userId: user.id,
      });

      return res.status(200).json({
        data: {
          tokenType: "Bearer",
          accessToken: token,
          expiresAt: expiresAt.toISOString(),
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
          },
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return sendProblem(req, res, {
          title: "Unprocessable Entity",
          status: 422,
          detail: "Validation failed",
          errors: zodErrorToFieldMap(error),
          requestId: res.locals.requestId,
        });
      }

      return next(error);
    }
  });

  router.post("/logout", requireAuth, async (req, res, next) => {
    try {
      const tokenHash = res.locals.sessionTokenHash as string | undefined;
      if (!tokenHash) {
        return sendProblem(req, res, {
          title: "Unauthorized",
          status: 401,
          detail: "Missing active session",
          requestId: res.locals.requestId,
        });
      }

      await deps.repo.revokeSessionByTokenHash(tokenHash);

      logger.info("auth.logout.success", {
        requestId: res.locals.requestId,
        userId: (res.locals.authUser as { id: string } | undefined)?.id,
      });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

export const authRouter = createAuthRouter({ repo: authRepo });
