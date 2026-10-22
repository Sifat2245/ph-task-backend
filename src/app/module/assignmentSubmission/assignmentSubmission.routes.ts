import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AssignmentSubmissionController } from "./assignmentSubmission.controller";

export const assignmentSubmissionRoutes = Router();

assignmentSubmissionRoutes.use(checkAuth(UserRole.STUDENT));
assignmentSubmissionRoutes.post("/submit-assignment", AssignmentSubmissionController.submitAssignment);
