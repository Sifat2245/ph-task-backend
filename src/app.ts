import express, { Application, Request, Response } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import { routerIndex } from "./app/router";

const app: Application = express();

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use("/api/v1", routerIndex);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Express server is running" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
