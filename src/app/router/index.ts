import { Router } from "express";
import { userRoutes } from "../module/user/user.routes";
import { authRoutes } from "../module/auth/auth.route";
import { assignmentRoutes } from "../module/assignment/assignment.routes";
import { assignmentSubmissionRoutes } from "../module/assignmentSubmission/assignmentSubmission.routes";
import { submissionSkipRoutes } from "../module/submissionSkip/submissionSkip.routes";
import { assignmentReviewRoutes } from "../module/assignmentReview/assignmentReview.routes";
import { studentRoutes } from "../module/student/student.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/assignment-submission", assignmentSubmissionRoutes);
router.use("/submission-skip", submissionSkipRoutes);
router.use("/assignment-review", assignmentReviewRoutes);
router.use("/student", studentRoutes);

export const routerIndex = router;
