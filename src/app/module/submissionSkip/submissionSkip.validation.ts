import { APIError } from "better-auth/api";
import { parseAssignmentId } from "../assignment/assignment.validation";

export const parseSkipAssignment = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", { message: "Skip details are required." });
  }
  const data = payload as Record<string, unknown>;
  const allowedFields = new Set(["assignmentId", "reason"]);
  for (const field of Object.keys(data)) {
    if (!allowedFields.has(field)) {
      throw new APIError("BAD_REQUEST", {
        message: `Field ${field} cannot be set through assignment skipping.`,
      });
    }
  }
  if (typeof data.reason !== "string" || !data.reason.trim()) {
    throw new APIError("BAD_REQUEST", { message: "A skip reason is required." });
  }
  return { assignmentId: parseAssignmentId(data.assignmentId), reason: data.reason.trim() };
};
