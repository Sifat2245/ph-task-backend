import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { StudentController } from "./student.controller";

export const studentRoutes = Router();

studentRoutes.use(checkAuth(UserRole.ADMIN, UserRole.MENTOR));
studentRoutes.get("/get-all-students", StudentController.getAllStudents);
studentRoutes.get(
  "/get-single-student/:id",
  StudentController.getSingleStudent,
);
