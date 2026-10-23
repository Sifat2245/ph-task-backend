import { APIError } from "better-auth/api";
import { Prisma } from "../../../generated/prisma/client.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { parseCreateAssignment, parseUpdateAssignment } from "./assignment.validation.js";
import { getStudentProfile, getUnlockedAssignment } from "./assignment.access.js";

type AssignmentViewer = { id: string; role?: UserRole | null };

const isStaff = (user: AssignmentViewer): boolean => {
  if (user.role === UserRole.ADMIN || user.role === UserRole.MENTOR) return true;
  if (user.role !== UserRole.STUDENT) {
    throw new APIError("FORBIDDEN", { message: "A valid user role is required." });
  }
  return false;
};

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

    if (error.code === "P2003") {
      const conflict = new APIError("CONFLICT", {
        message: "Assignment cannot be deleted while it has submission, skip, or progress records.",
      });
      conflict.cause = error;
      throw conflict;
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

const getAllAssignments = async (user: AssignmentViewer) => {
  if (isStaff(user)) {
    return prisma.assignment.findMany({ orderBy: { assignmentNumber: "asc" } });
  }
  const student = await getStudentProfile(prisma, user.id);
  const assignments = await prisma.assignment.findMany({
    orderBy: { assignmentNumber: "asc" },
    include: { submissionProgress: { where: { studentId: student.id }, select: { state: true } } },
  });
  let previousAssignmentsCompleted = true;
  return assignments.map(({ submissionProgress, ...assignment }) => {
    const progressState = submissionProgress[0]?.state ?? null;
    const isLocked = !previousAssignmentsCompleted;
    previousAssignmentsCompleted = previousAssignmentsCompleted && progressState !== null;
    return {
      ...assignment,
      description: isLocked ? null : assignment.description,
      isLocked,
      progressState,
    };
  });
};

const getSingleAssignment = async (id: string, user: AssignmentViewer) => {
  if (!isStaff(user)) {
    const student = await getStudentProfile(prisma, user.id);
    const assignment = await getUnlockedAssignment(prisma, student.id, id);
    const progress = await prisma.submissionProgress.findUnique({
      where: { studentId_assignmentId: { studentId: student.id, assignmentId: id } },
      select: { state: true },
    });
    return { ...assignment, isLocked: false, progressState: progress?.state ?? null };
  }
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
