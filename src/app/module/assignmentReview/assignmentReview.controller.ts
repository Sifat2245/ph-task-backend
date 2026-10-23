import type { Request, Response } from "express";
import status from "http-status";
import { getAuthSession } from "../../middleware/checkAuth.js";
import { CatchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AssignmentReviewService } from "./assignmentReview.service.js";
import { parseReviewId, parseSubmissionId } from "./assignmentReview.validation.js";

const createReview = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentReviewService.createReview(
    getAuthSession(res).user.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Review submitted successfully",
    data: result,
  });
});

const getAllSubmissions = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentReviewService.getAllSubmissions(
    getAuthSession(res).user.id,
    req.query,
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Submissions fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleSubmission = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentReviewService.getSingleSubmission(
    parseSubmissionId(req.params.id),
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Submission fetched successfully",
    data: result,
  });
});

const getMyReviews = CatchAsync(async (_req: Request, res: Response) => {
  const result = await AssignmentReviewService.getMyReviews(getAuthSession(res).user.id);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your reviews fetched successfully",
    data: result,
  });
});

const getMyReview = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentReviewService.getMyReview(
    getAuthSession(res).user.id,
    parseReviewId(req.params.id),
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your review fetched successfully",
    data: result,
  });
});

const updateReview = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentReviewService.updateReview(
    getAuthSession(res).user.id,
    parseReviewId(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

export const AssignmentReviewController = {
  createReview,
  getAllSubmissions,
  getSingleSubmission,
  getMyReviews,
  getMyReview,
  updateReview,
};
