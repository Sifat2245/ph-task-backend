import { APIError } from "better-auth/api";

type ReviewInput = { marks: number; examineFeedback: string };

const parseUuid = (value: unknown, label: string): string => {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new APIError("BAD_REQUEST", { message: `A valid ${label} ID is required.` });
  }
  return value;
};

export const parseReviewId = (id: unknown) => parseUuid(id, "review");
export const parseSubmissionId = (id: unknown) => parseUuid(id, "submission");

const getPayload = (payload: unknown, allowedFields: string[]): Record<string, unknown> => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", { message: "Review details are required." });
  }
  for (const field of Object.keys(payload)) {
    if (!allowedFields.includes(field)) {
      throw new APIError("BAD_REQUEST", { message: `Field ${field} cannot be set through assignment review.` });
    }
  }
  return payload as Record<string, unknown>;
};

const getMarks = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 2147483647) {
    throw new APIError("BAD_REQUEST", { message: "Marks must be an integer between 0 and 2147483647." });
  }
  return value;
};

const getFeedback = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new APIError("BAD_REQUEST", { message: "Review feedback is required." });
  }
  return value.trim();
};

export const parseCreateReview = (payload: unknown): ReviewInput & { revisionId: string } => {
  const data = getPayload(payload, ["revisionId", "marks", "examineFeedback"]);
  return {
    revisionId: parseUuid(data.revisionId, "revision"),
    marks: getMarks(data.marks),
    examineFeedback: getFeedback(data.examineFeedback),
  };
};

export const parseUpdateReview = (payload: unknown): Partial<ReviewInput> => {
  const data = getPayload(payload, ["marks", "examineFeedback"]);
  if (!Object.keys(data).length) {
    throw new APIError("BAD_REQUEST", { message: "Provide marks or feedback to update." });
  }
  const result: Partial<ReviewInput> = {};
  if ("marks" in data) result.marks = getMarks(data.marks);
  if ("examineFeedback" in data) result.examineFeedback = getFeedback(data.examineFeedback);
  return result;
};
