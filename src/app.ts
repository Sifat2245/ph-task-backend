import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth.js";
import { routerIndex } from "./app/router/index.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import cookieParser from "cookie-parser";
import status from "http-status";
import { sendResponse } from "./app/shared/sendResponse.js";
import { corsMiddleware } from "./app/middleware/cors.js";

const app: Application = express();

app.use(corsMiddleware);

app.post("/api/auth/sign-up/email", (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: status.BAD_REQUEST,
    success: false,
    message: "Register through POST /api/v1/auth/signup.",
  });
});

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cookieParser())

app.use("/api/v1", routerIndex);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Express server is running" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
