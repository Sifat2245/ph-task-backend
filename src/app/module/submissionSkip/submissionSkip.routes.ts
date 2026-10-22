import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { SubmissionSkipController } from "./submissionSkip.controller";

export const submissionSkipRoutes = Router();

submissionSkipRoutes.use(checkAuth(UserRole.STUDENT));
submissionSkipRoutes.post("/skip-assignment", SubmissionSkipController.skipAssignment);
