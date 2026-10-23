import type { Request, Response } from "express";
import status from "http-status";
import { fromNodeHeaders } from "better-auth/node";
import { CatchAsync } from "../../shared/catchAsync.js";
import { UserService } from "./user.service.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { getAuthSession } from "../../middleware/checkAuth.js";
import { parseMentorId } from "./user.validation.js";

const createUser = CatchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await UserService.createUser(
    payload,
    getAuthSession(res).user.id,
    fromNodeHeaders(req.headers),
  );

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: "Mentor created successfully",
    data: result,
  });
});

const getUsers = CatchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUsers();
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Mentors fetched successfully",
    data: result,
  });
});

const updateUser = CatchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateUser(parseMentorId(req.params.id), req.body);
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Mentor updated successfully",
    data: result,
  });
});

const deleteUser = CatchAsync(async (req: Request, res: Response) => {
  const result = await UserService.deleteUser(parseMentorId(req.params.id));
  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: "Mentor deleted successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
};
