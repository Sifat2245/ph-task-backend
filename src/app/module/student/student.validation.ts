import { APIError } from "better-auth/api";

export const parseStudentId = (id: unknown): string => {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    throw new APIError("BAD_REQUEST", {
      message: "A valid student profile ID is required.",
    });
  }
  return id;
};
