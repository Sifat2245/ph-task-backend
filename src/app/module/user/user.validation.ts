import { APIError } from "better-auth/api";

type CreateMentorInput = {
  name: string;
  email: string;
  password: string;
  image?: string;
};

type UpdateMentorInput = {
  name?: string;
  email?: string;
  password?: string;
  image?: string | null;
};

const allowedFields = new Set(["name", "email", "password", "image"]);
// Matches the email format accepted by Better Auth's sign-in endpoint.
const emailPattern =
  /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/;

export const parseMentorId = (id: unknown): string => {
  if (typeof id !== "string" || !id.trim()) {
    throw new APIError("BAD_REQUEST", { message: "Mentor ID is required." });
  }
  return id;
};

const getPayload = (payload: unknown): Record<string, unknown> => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new APIError("BAD_REQUEST", {
      message: "Mentor details are required.",
    });
  }

  for (const field of Object.keys(payload)) {
    if (!allowedFields.has(field)) {
      throw new APIError("BAD_REQUEST", {
        message: `Field ${field} cannot be set through mentor management.`,
      });
    }
  }

  return payload as Record<string, unknown>;
};

const getName = (name: unknown): string => {
  if (typeof name !== "string" || !name.trim()) {
    throw new APIError("BAD_REQUEST", { message: "Name is required." });
  }
  return name.trim();
};

const getEmail = (email: unknown): string => {
  if (typeof email !== "string" || !emailPattern.test(email.trim())) {
    throw new APIError("BAD_REQUEST", {
      message: "A valid email is required.",
    });
  }
  return email.trim().toLowerCase();
};

const getPassword = (password: unknown): string => {
  if (typeof password !== "string" || !password) {
    throw new APIError("BAD_REQUEST", { message: "Password is required." });
  }
  return password;
};

const getImage = (image: unknown): string | null => {
  if (image === null) return null;
  if (typeof image === "string") {
    const value = image.trim();
    if (URL.canParse(value)) {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") return value;
    }
  }

  throw new APIError("BAD_REQUEST", {
    message: "Image must be an HTTP or HTTPS URL, or null.",
  });
};

export const parseCreateMentor = (payload: unknown): CreateMentorInput => {
  const data = getPayload(payload);
  const image = "image" in data ? getImage(data.image) : null;

  return {
    name: getName(data.name),
    email: getEmail(data.email),
    password: getPassword(data.password),
    ...(image === null ? {} : { image }),
  };
};

export const parseUpdateMentor = (payload: unknown): UpdateMentorInput => {
  const data = getPayload(payload);
  if (!Object.keys(data).length) {
    throw new APIError("BAD_REQUEST", {
      message: "Provide at least one mentor field to update.",
    });
  }

  const result: UpdateMentorInput = {};
  if ("name" in data) result.name = getName(data.name);
  if ("email" in data) result.email = getEmail(data.email);
  if ("password" in data) result.password = getPassword(data.password);
  if ("image" in data) result.image = getImage(data.image);
  return result;
};
