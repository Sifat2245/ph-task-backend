import type { Request, Response } from "express";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AssignmentService } from "./assignment.service";
import { parseAssignmentId } from "./assignment.validation";

const createAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentService.createAssignment(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Assignment created successfully",
    data: result,
  });
});

const getAllAssignments = CatchAsync(async (_req: Request, res: Response) => {
  const result = await AssignmentService.getAllAssignments();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assignments fetched successfully",
    data: result,
  });
});

const getSingleAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentService.getSingleAssignment(parseAssignmentId(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assignment fetched successfully",
    data: result,
  });
});

const updateAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentService.updateAssignment(
    parseAssignmentId(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assignment updated successfully",
    data: result,
  });
});

const deleteAssignment = CatchAsync(async (req: Request, res: Response) => {
  const result = await AssignmentService.deleteAssignment(parseAssignmentId(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assignment deleted successfully",
    data: result,
  });
});

export const AssignmentController = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
};
