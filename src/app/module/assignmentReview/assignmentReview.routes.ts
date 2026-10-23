import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { AssignmentReviewController } from "./assignmentReview.controller.js";

export const assignmentReviewRoutes = Router();

assignmentReviewRoutes.use(checkAuth(UserRole.ADMIN, UserRole.MENTOR));
assignmentReviewRoutes.get(
  "/get-all-submissions",
  AssignmentReviewController.getAllSubmissions,
);
assignmentReviewRoutes.get(
  "/get-submission-stats",
  AssignmentReviewController.getSubmissionStats,
);
assignmentReviewRoutes.get(
  "/get-single-submission/:id",
  AssignmentReviewController.getSingleSubmission,
);
assignmentReviewRoutes.post(
  "/create-review",
  AssignmentReviewController.createReview,
);
assignmentReviewRoutes.get(
  "/get-my-reviews",
  AssignmentReviewController.getMyReviews,
);
assignmentReviewRoutes.get(
  "/get-my-review/:id",
  AssignmentReviewController.getMyReview,
);
assignmentReviewRoutes.put(
  "/update-review/:id",
  AssignmentReviewController.updateReview,
);
