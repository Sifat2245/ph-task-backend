import type { RequestHandler } from "express";
import status from "http-status";
import { sendResponse } from "../shared/sendResponse.js";

export const notFound: RequestHandler = (_req, res) => {
  sendResponse(res, {
    statusCode: status.NOT_FOUND,
    success: false,
    message: "Route not found.",
  });
};
