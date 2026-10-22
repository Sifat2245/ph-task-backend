import { Router } from "express";
import { userRoutes } from "../module/user/user.routes";
import { authRoutes } from "../module/auth/auth.route";
import { assignmentRoutes } from "../module/assignment/assignment.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/assignment", assignmentRoutes);

export const routerIndex = router;
