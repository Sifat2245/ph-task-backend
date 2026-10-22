import type { RequestHandler } from "express";

export const CatchAsync = (fn: RequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Request failed",
      });
    }
  };
};
