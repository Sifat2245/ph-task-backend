import { APIError } from "better-auth/api";
import { parseAssignmentId } from "../assignment/assignment.validation";

export const parseSubmitAssignment = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Submission details are required.",
    });
  }
  const data = payload as Record<string, unknown>;
  const allowedFields = new Set(["assignmentId", "submissionItems", "note"]);
  for (const field of Object.keys(data)) {
    if (!allowedFields.has(field)) {
      throw new APIError("BAD_REQUEST", {
        message: `Field ${field} cannot be set through assignment submission.`,
      });
    }
  }
  if (
    typeof data.submissionItems !== "string" ||
    !data.submissionItems.trim()
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "Submission items are required.",
    });
  }
  if (typeof data.note !== "string" || !data.note.trim()) {
    throw new APIError("BAD_REQUEST", {
      message: "A submission note is required.",
    });
  }
  return {
    assignmentId: parseAssignmentId(data.assignmentId),
    submissionItems: data.submissionItems.trim(),
    note: data.note.trim(),
  };
};
