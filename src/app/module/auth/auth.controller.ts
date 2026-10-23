import type { Request, Response } from "express";
import status from "http-status";
import { fromNodeHeaders } from "better-auth/node";
import { CatchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import { tokenUtils } from "../../utils/token";
import { cookieUtils } from "../../utils/cookie";

const createStudent = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.createStudent(
    req.body,
    fromNodeHeaders(req.headers),
  );

  const { accessToken, refreshToken, token, ...rest } = result.data;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  // Better Auth reads its signed session cookie when resolving a session.
  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Student created successfully",
    data: { token, accessToken, refreshToken, ...rest },
  });
});

const signIn = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signIn(
    req.body,
    fromNodeHeaders(req.headers),
  );

  const { accessToken, refreshToken, token, ...rest } = result.data;
  tokenUtils.setAccessTokenCookie(res, accessToken);
  tokenUtils.setRefreshTokenCookie(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookie(res, token);

  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Signed in successfully",
    data: { token, accessToken, refreshToken, ...rest },
  });
});

const logout = CatchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.logout(fromNodeHeaders(req.headers));

  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }

  for (const key of ["accessToken", "refreshToken", "betterAuthSession"]) {
    cookieUtils.clearCookie(res, key);
  }

  sendResponse(res, {
    statusCode: status.OK,
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
