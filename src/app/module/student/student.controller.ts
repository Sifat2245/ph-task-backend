import type { Request, Response } from "express";
import status from "http-status";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { StudentService } from "./student.service";
import { parseStudentId } from "./student.validation";

const getAllStudents = CatchAsync(async (_req: Request, res: Response) => {
  const result = await StudentService.getAllStudents();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Students fetched successfully",
    data: result,
  });
});

const getSingleStudent = CatchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getSingleStudent(
    parseStudentId(req.params.id),
  );
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Student fetched successfully",
    data: result,
  });
});

export const StudentController = { getAllStudents, getSingleStudent };
