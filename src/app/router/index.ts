import { Router } from "express";
import { userRoutes } from "../module/user/user.routes";
import { authRoutes } from "../module/auth/auth.route";
import { assignmentRoutes } from "../module/assignment/assignment.routes";
import { assignmentSubmissionRoutes } from "../module/assignmentSubmission/assignmentSubmission.routes";
import { submissionSkipRoutes } from "../module/submissionSkip/submissionSkip.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/assignment-submission", assignmentSubmissionRoutes);
router.use("/submission-skip", submissionSkipRoutes);

export const routerIndex = router;
