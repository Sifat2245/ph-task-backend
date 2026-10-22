import type { Request, Response } from "express";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const createStudent = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.createStudent(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Student created successfully",
    data: result,
  });
});

export const AuthController = {
  createStudent,
};
