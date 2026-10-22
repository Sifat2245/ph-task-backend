/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import { envVariables } from "../../config/env";
import status from "http-status";

export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) =>{
    if (envVariables.NODE_ENV ==="development"){
        console.log(err)
    }

    const statusCode: number = status.INTERNAL_SERVER_ERROR;
    const message: string = 'internal server error'

    res.status(statusCode).json({
        success: true,
        message: message,
        error: err.message
    })
}