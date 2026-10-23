import { Router } from "express";
import { UserController } from "./user.controller.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";


export const userRoutes = Router();

userRoutes.use(checkAuth(UserRole.ADMIN));

userRoutes.post("/create-mentor", UserController.createUser);
userRoutes.get("/get-all-mentors", UserController.getUsers);
userRoutes.put("/update-mentor/:id", UserController.updateUser);
userRoutes.delete("/delete-mentor/:id", UserController.deleteUser);
