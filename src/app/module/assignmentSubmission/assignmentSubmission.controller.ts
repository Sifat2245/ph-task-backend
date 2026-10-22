import type { Request, Response } from "express";
import status from "http-status";
import { getAuthSession } from "../../middleware/checkAuth";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AssignmentSubmissionService } from "./assignmentSubmission.service";

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

export const AssignmentSubmissionController = { submitAssignment };
