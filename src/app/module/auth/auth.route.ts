import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/create-student", AuthController.createStudent);

export const authRoutes = router;

