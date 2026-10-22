import { Router } from "express";
import { UserController } from "./user.controller";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";


export const userRoutes = Router();

userRoutes.use(checkAuth(UserRole.ADMIN));

userRoutes.post("/create-mentor", UserController.createUser);
userRoutes.get("/get-all-mentors", UserController.getUsers);
userRoutes.put("/update-mentor/:id", UserController.updateUser);
userRoutes.delete("/delete-mentor/:id", UserController.deleteUser);
