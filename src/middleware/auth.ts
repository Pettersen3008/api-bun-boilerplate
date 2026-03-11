import type { RequestHandler } from "express";
import type { IAuthRepo, SessionUser } from "../repo/auth";
import { sendProblem } from "../utils/problem";
import { sha256Hex } from "../utils/security";

export type AuthLocals = {
  requestId?: string;
  authUser?: SessionUser;
  sessionTokenHash?: string;
};

export function createAuthMiddleware(deps: { repo: IAuthRepo }): RequestHandler {
  return async (req, res, next) => {
    const authHeader = req.header("authorization") ?? "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return sendProblem(req, res, {
        title: "Unauthorized",
        status: 401,
        detail: "Missing or invalid Authorization header",
        requestId: res.locals.requestId,
      });
    }

    const tokenHash = await sha256Hex(token);
    const user = await deps.repo.findActiveSessionUserByTokenHash(tokenHash);

    if (!user) {
      return sendProblem(req, res, {
        title: "Unauthorized",
        status: 401,
        detail: "Invalid or expired token",
        requestId: res.locals.requestId,
      });
    }

    res.locals.authUser = user;
    res.locals.sessionTokenHash = tokenHash;
    return next();
  };
}
