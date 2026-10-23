import type { RequestHandler } from "express";
import { APIError } from "better-auth/api";
import { envVariables } from "../../config/env.js";

const allowedOrigins = new Set([
  envVariables.FRONTEND_URL,
  new URL(envVariables.BETTER_AUTH_URL).origin,
]);

export const corsMiddleware: RequestHandler = (req, res, next) => {
  const origin = req.get("Origin");
  res.vary("Origin");

  if (!origin) return next();
  if (!allowedOrigins.has(origin)) {
    return next(new APIError("FORBIDDEN", { message: "Origin is not allowed." }));
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "600");
    res.status(204).end();
    return;
  }

  next();
};
