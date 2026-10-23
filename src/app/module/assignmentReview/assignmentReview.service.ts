import { APIError } from "better-auth/api";
import type { Prisma } from "../../../generated/prisma/client.js";
import { SubmissionStatus } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { paginationUtils } from "../../utils/pagination.js";
import { withStudentTransaction } from "../assignment/assignment.access.js";
import {
  parseCreateReview,
  parseUpdateReview,
} from "./assignmentReview.validation.js";

const submissionContext = {
  assignment: {
    select: {
      id: true,
      assignmentNumber: true,
      title: true,
      description: true,
      maxMarks: true,
    },
  },
  student: {
    select: {
      id: true,
      user: { select: { id: true, name: true, studentId: true } },
    },
  },
} satisfies Prisma.AssignmentSubmissionInclude;

const reviewContext = {
  mentor: { select: { id: true, name: true } },
  revision: { include: { submission: { include: submissionContext } } },
} satisfies Prisma.AssignmentReviewInclude;

const getRevision = async (
  db: Prisma.TransactionClient,
  revisionId: string,
) => {
  const revision = await db.submissionRevision.findUnique({
    where: { id: revisionId },
    include: { submission: { include: submissionContext } },
  });
  if (!revision) {
    throw new APIError("NOT_FOUND", {
      message: "Submission revision not found.",
    });
  }
  return revision;
};

const validateMaximumMarks = (marks: number, maximum: number) => {
  if (marks > maximum) {
    throw new APIError("BAD_REQUEST", {
      message: `Marks cannot exceed the assignment maximum of ${maximum}.`,
    });
  }
};

const markLatestRevisionReviewed = async (
  tx: Prisma.TransactionClient,
  submissionId: string,
  revisionId: string,
) => {
  const latestRevision = await tx.submissionRevision.findFirst({
    where: { submissionId },
    orderBy: { version: "desc" },
    select: { id: true },
  });
  if (latestRevision?.id === revisionId) {
    await tx.assignmentSubmission.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.REVIEWED },
    });
  }
};

const createReview = async (reviewerId: string, payload: unknown) => {
  const data = parseCreateReview(payload);
  const target = await getRevision(prisma, data.revisionId);
  return withStudentTransaction(
    target.submission.student.user.id,
    async (tx) => {
      const revision = await getRevision(tx, data.revisionId);
      validateMaximumMarks(data.marks, revision.submission.assignment.maxMarks);
      const existingReview = await tx.assignmentReview.findFirst({
        where: { revisionId: revision.id, mentorId: reviewerId },
        select: { id: true },
      });
      if (existingReview) {
        throw new APIError("CONFLICT", {
          message:
            "You already reviewed this revision. Update your existing review.",
        });
      }
      const review = await tx.assignmentReview.create({
        data: { ...data, mentorId: reviewerId },
      });
      await markLatestRevisionReviewed(tx, revision.submissionId, revision.id);
      return tx.assignmentReview.findUniqueOrThrow({
        where: { id: review.id },
        include: reviewContext,
      });
    },
  );
};

const getAllSubmissions = async (
  reviewerId: string,
  query: Record<string, unknown> = {},
) => {
  const { page, limit, skip } = paginationUtils.getPaginationOptions(query);
  const where: Prisma.AssignmentSubmissionWhereInput = { revisions: { some: {} } };
  const [total, data] = await prisma.$transaction([
    prisma.assignmentSubmission.count({ where }),
    prisma.assignmentSubmission.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
      include: {
        ...submissionContext,
        revisions: {
          orderBy: { version: "desc" },
          take: 1,
          include: {
            reviews: {
              where: { mentorId: reviewerId },
              orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
            },
          },
        },
      },
    }),
  ], { isolationLevel: "RepeatableRead" });
  return { data, meta: paginationUtils.getPaginationMeta(page, limit, total) };
};

const getSingleSubmission = async (submissionId: string) => {
  const submission = await prisma.assignmentSubmission.findFirst({
    where: { id: submissionId, revisions: { some: {} } },
    include: {
      ...submissionContext,
      revisions: {
        orderBy: { version: "desc" },
        include: {
          reviews: {
            orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
            include: { mentor: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  if (!submission) {
    throw new APIError("NOT_FOUND", { message: "Submission not found." });
  }
  return submission;
};

const getMyReviews = (reviewerId: string) =>
  prisma.assignmentReview.findMany({
    where: { mentorId: reviewerId },
    orderBy: [{ reviewedAt: "desc" }, { id: "desc" }],
    include: reviewContext,
  });

const getMyReview = async (reviewerId: string, reviewId: string) => {
  const review = await prisma.assignmentReview.findFirst({
    where: { id: reviewId, mentorId: reviewerId },
    include: reviewContext,
  });
  if (!review) {
    throw new APIError("NOT_FOUND", { message: "Your review was not found." });
  }
  return review;
};

const updateReview = async (
  reviewerId: string,
  reviewId: string,
  payload: unknown,
) => {
  const data = parseUpdateReview(payload);
  const target = await getMyReview(reviewerId, reviewId);
  return withStudentTransaction(
    target.revision.submission.student.user.id,
    async (tx) => {
      const review = await tx.assignmentReview.findFirst({
        where: { id: reviewId, mentorId: reviewerId },
        include: reviewContext,
      });
      if (!review) {
        throw new APIError("NOT_FOUND", {
          message: "Your review was not found.",
        });
      }
      validateMaximumMarks(
        data.marks ?? review.marks,
        review.revision.submission.assignment.maxMarks,
      );
      await tx.assignmentReview.update({
        where: { id: review.id, mentorId: reviewerId },
        data: { ...data, reviewedAt: new Date() },
      });
      await markLatestRevisionReviewed(
        tx,
        review.revision.submissionId,
        review.revisionId,
      );
      return tx.assignmentReview.findUniqueOrThrow({
        where: { id: review.id },
        include: reviewContext,
      });
    },
  );
};

export const AssignmentReviewService = {
  createReview,
  getAllSubmissions,
  getSingleSubmission,
  getMyReviews,
  getMyReview,
  updateReview,
};
