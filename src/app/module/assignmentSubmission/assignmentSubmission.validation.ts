import { APIError } from "better-auth/api";
import { parseAssignmentId } from "../assignment/assignment.validation.js";

const parseText = (
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
) => {
  if (
    typeof value !== "string" ||
    value.trim().length < minimum ||
    value.trim().length > maximum
  ) {
    throw new APIError("BAD_REQUEST", {
      message: `${label} must be between ${minimum} and ${maximum} characters.`,
    });
  }
  return value.trim();
};

const parseProjectUrl = (value: unknown, label: string) => {
  const text = parseText(value, label, 1, 2048);
  try {
    const url = new URL(text);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      throw new Error("Unsupported URL");
    }
    const normalized = url.toString();
    if (normalized.length > 2048) throw new Error("URL too long");
    return normalized;
  } catch {
    throw new APIError("BAD_REQUEST", {
      message: `${label} must be an absolute HTTP or HTTPS URL without embedded credentials.`,
    });
  }
};

export const parseSubmitAssignment = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Submission details are required.",
    });
  }
  const data = payload as Record<string, unknown>;
  const allowedFields = new Set([
    "assignmentId",
    "projectName",
    "repoUrl",
    "liveLink",
    "description",
    "note",
  ]);
  for (const field of Object.keys(data)) {
    if (!allowedFields.has(field)) {
      throw new APIError("BAD_REQUEST", {
        message: `Field ${field} cannot be set through assignment submission.`,
      });
    }
  }
  return {
    assignmentId: parseAssignmentId(data.assignmentId),
    projectName: parseText(data.projectName, "Project name", 3, 150),
    repoUrl: parseProjectUrl(data.repoUrl, "Repository URL"),
    liveLink: parseProjectUrl(data.liveLink, "Live link"),
    description: parseText(data.description, "Project description", 10, 10000),
    note:
      data.note === undefined
        ? ""
        : parseText(data.note, "Reviewer note", 0, 5000),
  };
};
