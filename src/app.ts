import express, { Application, Request, Response } from "express";
import { userRoutes } from "./app/module/user/user.routes";

const app: Application = express();

app.use(express.json());
app.use("/users", userRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Express server is running" });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

export default app;
