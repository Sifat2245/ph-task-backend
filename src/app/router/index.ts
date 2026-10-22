import { Router } from "express";
import { userRoutes } from "../module/user/user.routes";

const router = Router()

router.use("/user", userRoutes);

export const routerIndex = router;