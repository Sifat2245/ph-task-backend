import { APIError } from "better-auth/api";
import type { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

export const getStudentProfile = async (
  db: Prisma.TransactionClient,
  userId: string,
) => {
  const student = await db.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) {
    throw new APIError("FORBIDDEN", {
      message: "A student profile is required.",
    });
  }
  return student;
};

export const getUnlockedAssignment = async (
  db: Prisma.TransactionClient,
  studentId: string,
  assignmentId: string,
) => {
  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment) {
    throw new APIError("NOT_FOUND", { message: "Assignment not found." });
  }

  const incompleteAssignment = await db.assignment.findFirst({
    where: {
      assignmentNumber: { lt: assignment.assignmentNumber },
      submissionProgress: { none: { studentId } },
    },
    orderBy: { assignmentNumber: "asc" },
    select: { assignmentNumber: true },
  });
  if (incompleteAssignment) {
    throw new APIError("FORBIDDEN", {
      message: `Submit or skip assignment ${incompleteAssignment.assignmentNumber} to unlock this assignment.`,
    });
  }
  return assignment;
};

export const getNextAssignment = (
  db: Prisma.TransactionClient,
  assignmentNumber: number,
) =>
  db.assignment.findFirst({
    where: { assignmentNumber: { gt: assignmentNumber } },
    orderBy: { assignmentNumber: "asc" },
    select: { id: true, assignmentNumber: true, title: true },
  });

export const withStudentTransaction = <T>(
  userId: string,
  action: (tx: Prisma.TransactionClient, studentId: string) => Promise<T>,
) =>
  prisma.$transaction(
    async (tx) => {
      // Serialize progress changes for this student, including revision numbering.
      const [student] = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM student WHERE "userId" = ${userId} FOR UPDATE
  `;
      if (!student) {
        throw new APIError("FORBIDDEN", {
          message: "A student profile is required.",
        });
      }
      return action(tx, student.id);
    },
    { timeout: 10000 },
  );
