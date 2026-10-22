import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/signup", AuthController.createStudent);
router.post("/signin", AuthController.signIn);
router.post("/logout", AuthController.logout);

export const authRoutes = router;

