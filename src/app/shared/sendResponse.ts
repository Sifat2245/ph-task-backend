import type { Response } from "express";

interface IResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}
export const sendResponse = <T>(res: Response, responseData: IResponse<T>) => {
  const { statusCode, success, message, data } = responseData;
  res.status(statusCode).json({
    statusCode,
    success,
    message,
    data,
  });
};
