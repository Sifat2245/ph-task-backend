import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { envVariables } from "../../config/env";
import { UserRole } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

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

  trustedOrigins: [envVariables.BETTER_AUTH_URL],
});
