import { APIError } from "better-auth/api";
import type { User } from "../../../generated/prisma/client.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/prisma.js";
import { tokenUtils } from "../../utils/token.js";

type CreateStudentInput = {
  name: string;
  email: string;
  password: string;
};

type SignInInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

const createAuthTokens = (
  user: Pick<User, "id" | "email"> & { role?: UserRole | null },
) => {
  if (!user.role) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Cannot create tokens without a user role.",
    });
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: tokenUtils.getAccessToken(payload),
    refreshToken: tokenUtils.getRefreshToken(payload),
  };
};

const createStudent = async (
  payload: CreateStudentInput,
  headers?: Headers,
) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Student details are required.",
    });
  }

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new APIError("BAD_REQUEST", { message: "Name is required." });
  }

  const registration = await auth.api.signUpEmail({
    body: {
      name: payload.name.trim(),
      email:
        typeof payload.email === "string"
          ? payload.email.trim()
          : payload.email,
      password: payload.password,
    },
    headers,
    returnHeaders: true,
  });

  const { user: registeredUser, token } = registration.response;
  if (!registeredUser) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Failed to register student.",
    });
  }

  try {
    if (!token) {
      throw new APIError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create registration session.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const [sequence] = await tx.$queryRaw<{ nextId: bigint }[]>`
        SELECT nextval('student_id_sequence'::regclass) AS "nextId"
      `;

      if (!sequence) throw new Error("Unable to generate a student ID.");

      const user = await tx.user.update({
        where: { id: registeredUser.id },
        data: {
          role: UserRole.STUDENT,
          studentId: `STU-${sequence.nextId.toString().padStart(3, "0")}`,
        },
      });

      const student = await tx.student.create({
        data: { userId: registeredUser.id },
      });

      const session = await tx.session.findUniqueOrThrow({
        where: { token },
      });

      return { session, user, student, token, ...createAuthTokens(user) };
    });

    // The signup cache contains the user before the student profile transaction.
    const cacheName = (await auth.$context).authCookies.sessionData.name;
    const cookies = registration.headers.getSetCookie();
    registration.headers.delete("Set-Cookie");
    for (const cookie of cookies) {
      if (!cookie.startsWith(`${cacheName}=`) && !cookie.startsWith(`${cacheName}.`)) {
        registration.headers.append("Set-Cookie", cookie);
      }
    }

    return { headers: registration.headers, data: result };
  } catch (error) {
    try {
      await prisma.user.delete({ where: { id: registeredUser.id } });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Student registration failed.",
        { cause: cleanupError },
      );
    }

    throw error;
  }
};

const signIn = async (payload: SignInInput, headers?: Headers) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Sign-in details are required.",
    });
  }

  const result = await auth.api.signInEmail({
    body: {
      email:
        typeof payload.email === "string"
          ? payload.email.trim()
          : payload.email,
      password: payload.password,
      rememberMe: payload.rememberMe,
    },
    headers,
    returnHeaders: true,
  });

  try {
    return {
      headers: result.headers,
      data: { ...result.response, ...createAuthTokens(result.response.user) },
    };
  } catch (error) {
    try {
      await prisma.session.deleteMany({
        where: { token: result.response.token },
      });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Sign-in failed and session cleanup failed.",
        { cause: cleanupError },
      );
    }

    throw error;
  }
};

const logout = async (headers: Headers) => {
  const result = await auth.api.signOut({
    headers,
    returnHeaders: true,
  });

  return { headers: result.headers, data: result.response };
};

export const AuthService = {
  createStudent,
  signIn,
  logout,
};
