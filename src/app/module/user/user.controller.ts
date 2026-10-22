import type { Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { CatchAsync } from "../../shared/catchAsync";
import { UserService } from "./user.service";
import { sendResponse } from "../../shared/sendResponse";

const createUser = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await UserService.createUser(
    payload,
    fromNodeHeaders(req.headers),
  );

  for (const cookie of result.headers.getSetCookie()) {
    res.append("Set-Cookie", cookie);
  }
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result.data,
  });
});

const getUsers = CatchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUsers();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getUsers,
};
