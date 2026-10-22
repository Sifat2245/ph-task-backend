import { APIError } from "better-auth/api";
import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { parseCreateAssignment, parseUpdateAssignment } from "./assignment.validation";

const rethrowAssignmentError = (error: unknown): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const conflict = new APIError("CONFLICT", {
        message: "An assignment with this number already exists.",
      });
      conflict.cause = error;
      throw conflict;
    }

    if (error.code === "P2025") {
      const notFound = new APIError("NOT_FOUND", {
        message: "Assignment not found.",
      });
      notFound.cause = error;
      throw notFound;
    }
  }
  throw error;
};

const createAssignment = async (payload: unknown) => {
  const data = parseCreateAssignment(payload);
  try {
    return await prisma.assignment.create({ data });
  } catch (error) {
    rethrowAssignmentError(error);
  }
};

const getAllAssignments = async () => {
  return prisma.assignment.findMany({ orderBy: { assignmentNumber: "asc" } });
};

const getSingleAssignment = async (id: string) => {
  try {
    return await prisma.assignment.findUniqueOrThrow({ where: { id } });
  } catch (error) {
    rethrowAssignmentError(error);
  }
};

const updateAssignment = async (id: string, payload: unknown) => {
  const data = parseUpdateAssignment(payload);
  try {
    return await prisma.assignment.update({ where: { id }, data });
  } catch (error) {
    rethrowAssignmentError(error);
  }
};

const deleteAssignment = async (id: string) => {
  try {
    return await prisma.assignment.delete({ where: { id } });
  } catch (error) {
    rethrowAssignmentError(error);
  }
};

export const AssignmentService = {
  createAssignment,
  getAllAssignments,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
};
