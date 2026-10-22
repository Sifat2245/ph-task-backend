import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { UserRole } from "../../generated/prisma/enums";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
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

  trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
});
