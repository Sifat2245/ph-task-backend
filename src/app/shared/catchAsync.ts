import type { RequestHandler } from "express";
import { isAPIError } from "better-auth/api";

export const CatchAsync = (fn: RequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(error);
      res.status(isAPIError(error) ? error.statusCode : 500).json({
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      });
    }
  };
};
