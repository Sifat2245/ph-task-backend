import type { Response } from "express";
import { APIError } from "better-auth/api";
import { fromNodeHeaders } from "better-auth/node";
import { envVariables } from "../../config/env.js";
import type { UserRole } from "../../generated/prisma/enums.js";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { CatchAsync } from "../shared/catchAsync.js";
import { cookieUtils } from "../utils/cookie.js";
import { jwtUtils } from "../utils/jwt.js";

type AuthSession = typeof auth.$Infer.Session;

export const checkAuth = (...roles: UserRole[]) =>
  CatchAsync(async (req, res, next) => {
    const accessToken = cookieUtils.getCookie(req, "accessToken");
    if (!accessToken) {
      throw new APIError("UNAUTHORIZED", { message: "Access token is required." });
    }

    let accessPayload: ReturnType<typeof jwtUtils.verifyToken>;
    try {
      accessPayload = jwtUtils.verifyToken(accessToken, envVariables.JWT_ACCESS_SECRET);
    } catch {
      throw new APIError("UNAUTHORIZED", {
        message: "Invalid or expired access token.",
      });
    }

    if (
      typeof accessPayload === "string" ||
      typeof accessPayload.userId !== "string" ||
      !accessPayload.userId ||
      typeof accessPayload.exp !== "number" ||
      !Number.isFinite(accessPayload.exp)
    ) {
      throw new APIError("UNAUTHORIZED", { message: "Invalid access token." });
    }

    const sessionToken = cookieUtils.getCookie(req, "betterAuthSession");
    let session: AuthSession | null = null;

    if (sessionToken) {
      const storedSession = await prisma.session.findFirst({
        where: { token: sessionToken, expiresAt: { gt: new Date() } },
        include: { user: true },
      });

      if (storedSession) {
        const { user, ...sessionData } = storedSession;
        session = { session: sessionData, user };
      }
    } else {
      // Better Auth verifies the signature on its own session cookie.
      session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
        query: { disableCookieCache: true, disableRefresh: true },
      });
    }

    if (!session) {
      throw new APIError("UNAUTHORIZED", { message: "Please sign in first." });
    }

    if (accessPayload.userId !== session.user.id) {
      throw new APIError("UNAUTHORIZED", {
        message: "Access token does not match the session user.",
      });
    }

    if (roles.length && !roles.some((role) => role === session.user.role)) {
      throw new APIError("FORBIDDEN", {
        message: "You do not have permission to perform this action.",
      });
    }

    res.locals.authSession = session;
    next();
  });

export const getAuthSession = (res: Response): AuthSession => {
  const session = res.locals.authSession as AuthSession | undefined;
  if (!session) {
    throw new APIError("UNAUTHORIZED", { message: "Please sign in first." });
  }

  return session;
};
