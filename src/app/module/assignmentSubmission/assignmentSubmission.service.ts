import {
  SubmissionProgressState,
  SubmissionStatus,
} from "../../../generated/prisma/enums";
import {
  getNextAssignment,
  getUnlockedAssignment,
  withStudentTransaction,
} from "../assignment/assignment.access";
import { parseSubmitAssignment } from "./assignmentSubmission.validation";

const submitAssignment = async (userId: string, payload: unknown) => {
  const data = parseSubmitAssignment(payload);
  return withStudentTransaction(userId, async (tx, studentId) => {
    const assignment = await getUnlockedAssignment(
      tx,
      studentId,
      data.assignmentId,
    );
    const existingSubmission = await tx.assignmentSubmission.findFirst({
      where: { studentId, assignmentId: assignment.id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { revisions: { orderBy: { version: "desc" }, take: 1 } },
    });
    const submission = existingSubmission
      ? await tx.assignmentSubmission.update({
          where: { id: existingSubmission.id },
          data: { status: SubmissionStatus.PENDING },
        })
      : await tx.assignmentSubmission.create({
          data: { studentId, assignmentId: assignment.id },
        });
    const revision = await tx.submissionRevision.create({
      data: {
        submissionId: submission.id,
        version: (existingSubmission?.revisions[0]?.version ?? 0) + 1,
        submissionItems: data.submissionItems,
        note: data.note,
      },
    });
    const progress = await tx.submissionProgress.upsert({
      where: {
        studentId_assignmentId: { studentId, assignmentId: assignment.id },
      },
      create: {
        studentId,
        assignmentId: assignment.id,
        state: SubmissionProgressState.SUBMITTED,
      },
      update: { state: SubmissionProgressState.SUBMITTED },
    });
    const nextAssignment = await getNextAssignment(
      tx,
      assignment.assignmentNumber,
    );
    return { submission, revision, progress, nextAssignment };
  });
};

export const AssignmentSubmissionService = { submitAssignment };
