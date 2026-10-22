import { randomUUID } from "node:crypto";
import { APIError } from "better-auth/api";
import { Prisma, UserRole } from "../../../generated/prisma/client";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

type CreateStudentInput = {
  name: string;
  email: string;
  password: string;
};

// Use the same email format as Better Auth's sign-in endpoint.
const emailPattern =
  /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

const createStudent = async (payload: CreateStudentInput) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Student details are required.",
    });
  }

  if (typeof payload.name !== "string" || !payload.name.trim()) {
    throw new APIError("BAD_REQUEST", { message: "Name is required." });
  }

  if (
    typeof payload.email !== "string" ||
    !emailPattern.test(payload.email.trim())
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "A valid email is required.",
    });
  }

  const context = await auth.$context;
  const { minPasswordLength, maxPasswordLength } = context.password.config;
  if (
    typeof payload.password !== "string" ||
    payload.password.length < minPasswordLength ||
    payload.password.length > maxPasswordLength
  ) {
    throw new APIError("BAD_REQUEST", {
      message: `Password must be between ${minPasswordLength} and ${maxPasswordLength} characters.`,
    });
  }

  const email = payload.email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new APIError("UNPROCESSABLE_ENTITY", {
      message: "User already exists. Use another email.",
    });
  }

  const password = await context.password.hash(payload.password);
  const userId = randomUUID();

  try {
    return await prisma.$transaction(async (tx) => {
      const [sequence] = await tx.$queryRaw<{ nextId: bigint }[]>`
        SELECT nextval('student_id_sequence'::regclass) AS "nextId"
      `;

      if (!sequence) throw new Error("Unable to generate a student ID.");

      return tx.user.create({
        data: {
          id: userId,
          name: payload.name.trim(),
          email,
          role: UserRole.STUDENT,
          studentId: `STU-${sequence.nextId.toString().padStart(3, "0")}`,
          accounts: {
            create: {
              id: randomUUID(),
              providerId: "credential",
              accountId: userId,
              password,
            },
          },
          student: { create: {} },
        },
        include: { student: true },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new APIError("UNPROCESSABLE_ENTITY", {
        message: "A user with this email or student ID already exists.",
      });
    }

    throw error;
  }
};

export const AuthService = {
  createStudent,
};
