import type { Request, Response } from "express";
import status from "http-status";
import { getAuthSession } from "../../middleware/checkAuth";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SubmissionSkipService } from "./submissionSkip.service";

const skipAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await SubmissionSkipService.skipAssignment(getAuthSession(res).user.id, req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Assignment skipped successfully",
    data: result,
  });
});

export const SubmissionSkipController = { skipAssignment };
