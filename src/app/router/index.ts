import { Router } from "express";
import { userRoutes } from "../module/user/user.routes.js";
import { authRoutes } from "../module/auth/auth.route.js";
import { assignmentRoutes } from "../module/assignment/assignment.routes.js";
import { assignmentSubmissionRoutes } from "../module/assignmentSubmission/assignmentSubmission.routes.js";
import { submissionSkipRoutes } from "../module/submissionSkip/submissionSkip.routes.js";
import { assignmentReviewRoutes } from "../module/assignmentReview/assignmentReview.routes.js";
import { studentRoutes } from "../module/student/student.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/assignment-submission", assignmentSubmissionRoutes);
router.use("/submission-skip", submissionSkipRoutes);
router.use("/assignment-review", assignmentReviewRoutes);
router.use("/student", studentRoutes);

export const routerIndex = router;
