import { APIError } from "better-auth/api";

type CreateAssignmentInput = {
  assignmentNumber: number;
  title: string;
  description: string;
  maxMarks: number;
};

const allowedFields = new Set([
  "assignmentNumber",
  "title",
  "description",
  "maxMarks",
]);

const getPayload = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Assignment details are required.",
    });
  }

  for (const field of Object.keys(payload)) {
    if (!allowedFields.has(field)) {
      throw new APIError("BAD_REQUEST", {
        message: `Field ${field} cannot be set through assignment management.`,
      });
    }
  }

  return payload as Record<string, unknown>;
};

const getPositiveInteger = (value: unknown, field: string): number => {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 2147483647
  ) {
    throw new APIError("BAD_REQUEST", {
      message: `${field} must be a positive integer no greater than 2147483647.`,
    });
  }
  return value;
};

const getText = (value: unknown, field: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new APIError("BAD_REQUEST", { message: `${field} is required.` });
  }
  return value.trim();
};

export const parseAssignmentId = (id: unknown): string => {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "A valid assignment ID is required.",
    });
  }
  return id;
};

export const parseCreateAssignment = (
  payload: unknown,
): CreateAssignmentInput => {
  const data = getPayload(payload);
  return {
    assignmentNumber: getPositiveInteger(
      data.assignmentNumber,
      "Assignment number",
    ),
    title: getText(data.title, "Title"),
    description: getText(data.description, "Description"),
    maxMarks: getPositiveInteger(data.maxMarks, "Maximum marks"),
  };
};

export const parseUpdateAssignment = (
  payload: unknown,
): Partial<CreateAssignmentInput> => {
  const data = getPayload(payload);
  if (!Object.keys(data).length) {
    throw new APIError("BAD_REQUEST", {
      message: "Provide at least one assignment field to update.",
    });
  }

  const result: Partial<CreateAssignmentInput> = {};
  if ("assignmentNumber" in data) {
    result.assignmentNumber = getPositiveInteger(
      data.assignmentNumber,
      "Assignment number",
    );
  }
  if ("title" in data) result.title = getText(data.title, "Title");
  if ("description" in data)
    result.description = getText(data.description, "Description");
  if ("maxMarks" in data)
    result.maxMarks = getPositiveInteger(data.maxMarks, "Maximum marks");
  return result;
};
