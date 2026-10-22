import { Router } from "express";
import { userRoutes } from "../module/user/user.routes";
import { authRoutes } from "../module/auth/auth.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);

export const routerIndex = router;
