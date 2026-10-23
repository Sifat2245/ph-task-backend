import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { AssignmentController } from "./assignment.controller.js";

export const assignmentRoutes = Router();

assignmentRoutes.get("/get-all-assignments", checkAuth(), AssignmentController.getAllAssignments);
assignmentRoutes.get("/get-single-assignment/:id", checkAuth(), AssignmentController.getSingleAssignment);

assignmentRoutes.use(checkAuth(UserRole.ADMIN, UserRole.MENTOR));

assignmentRoutes.post("/create-assignment", AssignmentController.createAssignment);
assignmentRoutes.put("/update-assignment/:id", AssignmentController.updateAssignment);
assignmentRoutes.delete("/delete-assignment/:id", AssignmentController.deleteAssignment);
