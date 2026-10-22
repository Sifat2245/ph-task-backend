import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { envVariables } from "../../config/env";
import { UserRole } from "../../generated/prisma/enums";
import { prisma } from "./prisma";
import ms from "ms";

export const auth = betterAuth({
  baseURL: envVariables.BETTER_AUTH_URL,
  secret: envVariables.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  advanced: {
    database: {
      generateId: () => randomUUID(),
    },
    disableCSRFCheck: true,
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    },
  },
  user: {
    additionalFields: {
      studentId: {
        type: "string",
        required: false,
        input: false,
      },
      role: {
        type: [UserRole.ADMIN, UserRole.MENTOR, UserRole.STUDENT],
        required: false,
        defaultValue: UserRole.STUDENT,
        input: false,
      },
      createdById: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  session: {
    expiresIn: ms(envVariables.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN) / 1000,
    updateAge: ms(envVariables.BETTER_AUTH_UPDATE_TOKEN_EXPIRES_IN) / 1000,
    cookieCache: {
      enabled: true,
      maxAge: ms(envVariables.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN) / 1000,
    },
  },

  trustedOrigins: [envVariables.BETTER_AUTH_URL],
});
