import type { Request, Response } from "express";
import status from "http-status";
import { CatchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { StudentService } from "./student.service.js";
import { parseStudentId } from "./student.validation.js";

const getAllStudents = CatchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getAllStudents(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Students fetched successfully",
    meta: result.meta,
    data: result.data,
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
