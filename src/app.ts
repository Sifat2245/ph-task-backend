import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import { routerIndex } from "./app/router";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";

const app: Application = express();

app.post("/api/auth/sign-up/email", (_req: Request, res: Response) => {
  res.status(400).json({
    success: false,
    message: "Register through POST /api/v1/auth/signup.",
  });
});

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

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
