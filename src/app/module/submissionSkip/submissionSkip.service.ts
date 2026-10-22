import { APIError } from "better-auth/api";
import { SubmissionProgressState } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import {
  getNextAssignment,
  getStudentProfile,
  getUnlockedAssignment,
  withStudentTransaction,
} from "../assignment/assignment.access";
import { parseSkipAssignment } from "./submissionSkip.validation";

const skipAssignment = async (userId: string, payload: unknown) => {
  const data = parseSkipAssignment(payload);
  return withStudentTransaction(userId, async (tx, studentId) => {
    const assignment = await getUnlockedAssignment(tx, studentId, data.assignmentId);
    const existingProgress = await tx.submissionProgress.findUnique({
      where: { studentId_assignmentId: { studentId, assignmentId: assignment.id } },
    });
    if (existingProgress) {
      throw new APIError("CONFLICT", {
        message: existingProgress.state === SubmissionProgressState.SUBMITTED
          ? "A submitted assignment cannot be skipped."
          : "This assignment has already been skipped.",
      });
    }
    const skip = await tx.submissionSkip.create({
      data: { studentId, assignmentId: assignment.id, reason: data.reason },
    });
    const progress = await tx.submissionProgress.create({
      data: { studentId, assignmentId: assignment.id, state: SubmissionProgressState.SKIPPED },
    });
    const nextAssignment = await getNextAssignment(tx, assignment.assignmentNumber);
    return { skip, progress, nextAssignment };
  });
};

const getMySkip = async (userId: string, assignmentId: string) => {
  const student = await getStudentProfile(prisma, userId);
  await getUnlockedAssignment(prisma, student.id, assignmentId);

  const skip = await prisma.submissionSkip.findFirst({
    where: { studentId: student.id, assignmentId },
    orderBy: [{ skippedAt: "desc" }, { id: "desc" }],
  });
  if (!skip) {
    throw new APIError("NOT_FOUND", {
      message: "You have not skipped this assignment.",
    });
  }
  return skip;
};

export const SubmissionSkipService = { skipAssignment, getMySkip };
