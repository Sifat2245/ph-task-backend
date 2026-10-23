import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { AssignmentSubmissionController } from "./assignmentSubmission.controller.js";

export const assignmentSubmissionRoutes = Router();

assignmentSubmissionRoutes.use(checkAuth(UserRole.STUDENT));
assignmentSubmissionRoutes.get("/get-my-submission/:assignmentId", AssignmentSubmissionController.getMySubmission);
assignmentSubmissionRoutes.post("/submit-assignment", AssignmentSubmissionController.submitAssignment);
