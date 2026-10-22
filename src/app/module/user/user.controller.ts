import type { Request, Response } from "express";
import { CatchAsync } from "../../shared/catchAsync";
import { UserService } from "./user.service";
import { sendResponse } from "../../shared/sendResponse";

const createUser = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await UserService.createUser(payload);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
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
