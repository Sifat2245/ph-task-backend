import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";

const createStudent = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.createStudent(
    req.body,
    fromNodeHeaders(req.headers),
  );

  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Student created successfully",
    data: result.data,
  });
});

const signIn = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signIn(
    req.body,
    fromNodeHeaders(req.headers),
  );

  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Signed in successfully",
    data: result.data,
  });
});

const logout = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.logout(fromNodeHeaders(req.headers));

  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Logged out successfully",
    data: result.data,
  });
});

export const AuthController = {
  createStudent,
  signIn,
  logout,
};
