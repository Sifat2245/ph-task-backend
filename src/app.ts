import express, { Application, Request, Response } from "express";
import { routerIndex } from "./app/router";

const app: Application = express();

app.use(express.json());

app.use("/api/v1", routerIndex);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Express server is running" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
