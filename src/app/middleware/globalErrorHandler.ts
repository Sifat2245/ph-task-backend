import type { ErrorRequestHandler } from "express";
import { isAPIError } from "better-auth/api";
import status from "http-status";
import { envVariables } from "../../config/env.js";
import { sendResponse } from "../shared/sendResponse.js";

export const globalErrorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = "Internal server error.";
  const errorType =
    error && typeof error === "object" && "type" in error
      ? error.type
      : undefined;

  if (isAPIError(error)) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (errorType === "entity.parse.failed") {
    statusCode = status.BAD_REQUEST;
    message = "Request body must be a valid JSON object.";
  } else if (errorType === "entity.too.large") {
    statusCode = status.REQUEST_ENTITY_TOO_LARGE;
    message = "Request body is too large.";
  }

  if (envVariables.NODE_ENV === "development") {
    console.error(error);
  }

  sendResponse(res, { statusCode, success: false, message });
};
