import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { SubmissionSkipController } from "./submissionSkip.controller.js";

export const submissionSkipRoutes = Router();

submissionSkipRoutes.use(checkAuth(UserRole.STUDENT));
submissionSkipRoutes.get("/get-my-skip/:assignmentId", SubmissionSkipController.getMySkip);
submissionSkipRoutes.post("/skip-assignment", SubmissionSkipController.skipAssignment);
