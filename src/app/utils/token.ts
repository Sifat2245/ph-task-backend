import type { JwtPayload } from "jsonwebtoken";
import type { Response } from "express";
import { envVariables } from "../../config/env";
import { cookieUtils } from "./cookie";
import { jwtUtils } from "./jwt";
import ms from "ms";

const getAccessToken = (payload: JwtPayload): string => {
  return jwtUtils.createToken(payload, envVariables.JWT_ACCESS_SECRET, {
    expiresIn: envVariables.JWT_ACCESS_EXPIRES_IN,
  });
};

const getRefreshToken = (payload: JwtPayload): string => {
  return jwtUtils.createToken(payload, envVariables.JWT_REFRESH_SECRET, {
    expiresIn: envVariables.JWT_REFRESH_EXPIRES_IN,
  });
};

const setAccessTokenCookie = (res: Response, token: string) => {
  const maxAge = ms(envVariables.JWT_ACCESS_EXPIRES_IN);
  return cookieUtils.setCookie(res, "accessToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge,
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  const maxAge = ms(envVariables.JWT_REFRESH_EXPIRES_IN);
  return cookieUtils.setCookie(res, "refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge,
  });
};

const setBetterAuthSessionCookie = (res: Response, token: string) => {
  const maxAge = ms(envVariables.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN);
  return cookieUtils.setCookie(res, "betterAuthSession", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge,
  });
};

export const tokenUtils = {
  getAccessToken,
  getRefreshToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setBetterAuthSessionCookie,
};
