import type { Request, Response } from "express";
import status from "http-status";
import { getAuthSession } from "../../middleware/checkAuth.js";
import { CatchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { AssignmentSubmissionService } from "./assignmentSubmission.service.js";
import { parseAssignmentId } from "../assignment/assignment.validation.js";

const submitAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentSubmissionService.submitAssignment(
    getAuthSession(res).user.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Assignment submitted successfully",
    data: result,
  });
});

const getMySubmission = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentSubmissionService.getMySubmission(
    getAuthSession(res).user.id,
    parseAssignmentId(req.params.assignmentId),
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your submission fetched successfully",
    data: result,
  });
});

export const AssignmentSubmissionController = { submitAssignment, getMySubmission };
