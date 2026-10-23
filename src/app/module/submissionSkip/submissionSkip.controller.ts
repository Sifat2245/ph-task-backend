import type { Request, Response } from "express";
import status from "http-status";
import { getAuthSession } from "../../middleware/checkAuth.js";
import { CatchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { SubmissionSkipService } from "./submissionSkip.service.js";
import { parseAssignmentId } from "../assignment/assignment.validation.js";

const skipAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionSkipService.skipAssignment(getAuthSession(res).user.id, req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Assignment skipped successfully",
    data: result,
  });
});

const getMySkip = CatchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionSkipService.getMySkip(
    getAuthSession(res).user.id,
    parseAssignmentId(req.params.assignmentId),
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Your skip record fetched successfully",
    data: result,
  });
});

export const SubmissionSkipController = { skipAssignment, getMySkip };
