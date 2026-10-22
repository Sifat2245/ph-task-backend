import { APIError } from "better-auth/api";
import { Prisma, UserRole } from "../../../generated/prisma/client";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { parseCreateMentor, parseUpdateMentor } from "./user.validation";

const rethrowUserError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const conflict = new APIError("CONFLICT", {
        message: "A user with this email already exists.",
      });
      conflict.cause = error;
      throw conflict;
    }

    if (error.code === "P2025") {
      const notFound = new APIError("NOT_FOUND", { message: "Mentor not found." });
      notFound.cause = error;
      throw notFound;
    }
  }

  throw error;
};

const createUser = async (
  payload: unknown,
  createdById: string,
  headers?: Headers,
) => {
  const data = parseCreateMentor(payload);
  const { user: registeredUser } = await auth.api.signUpEmail({
    body: data,
    headers,
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const mentor = await tx.user.update({
        where: { id: registeredUser.id },
        data: { role: UserRole.MENTOR, studentId: null, createdById },
      });

      // Discard the mentor's signup session and keep the admin signed in.
      await tx.session.deleteMany({ where: { userId: mentor.id } });
      return mentor;
    });
  } catch (error) {
    try {
      await prisma.user.delete({ where: { id: registeredUser.id } });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Mentor creation failed and account cleanup failed.",
        { cause: cleanupError },
      );
    }

    rethrowUserError(error);
  }
};

const getUsers = async () => {
  return prisma.user.findMany({
    where: { role: UserRole.MENTOR },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
};

const updateUser = async (id: string, payload: unknown) => {
  const data = parseUpdateMentor(payload);
  let passwordHash: string | undefined;

  if (data.password !== undefined) {
    const context = await auth.$context;
    const { minPasswordLength, maxPasswordLength } = context.password.config;
    if (
      data.password.length < minPasswordLength ||
      data.password.length > maxPasswordLength
    ) {
      throw new APIError("BAD_REQUEST", {
        message: `Password must be between ${minPasswordLength} and ${maxPasswordLength} characters.`,
      });
    }
    passwordHash = await context.password.hash(data.password);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const mentor = await tx.user.findFirst({
        where: { id, role: UserRole.MENTOR },
      });
      if (!mentor) {
        throw new APIError("NOT_FOUND", { message: "Mentor not found." });
      }

      if (passwordHash !== undefined) {
        const updated = await tx.account.updateMany({
          where: { userId: id, providerId: "credential", accountId: id },
          data: { password: passwordHash },
        });
        if (!updated.count) {
          throw new APIError("BAD_REQUEST", {
            message: "This mentor has no credential password to update.",
          });
        }
      }

      const emailChanged = data.email !== undefined && data.email !== mentor.email;
      const user = await tx.user.update({
        where: { id, role: UserRole.MENTOR },
        data: {
          name: data.name,
          email: data.email,
          image: data.image,
          ...(emailChanged ? { emailVerified: false } : {}),
        },
      });

      if (emailChanged || passwordHash !== undefined) {
        await tx.session.deleteMany({ where: { userId: id } });
      }

      return user;
    });
  } catch (error) {
    rethrowUserError(error);
  }
};

const deleteUser = async (id: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // Account and session relations cascade when this mentor is deleted.
      return tx.user.delete({ where: { id, role: UserRole.MENTOR } });
    });
  } catch (error) {
    rethrowUserError(error);
  }
};

export const UserService = {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
};
