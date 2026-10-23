import { APIError } from "better-auth/api";
import type { Prisma } from "../../../generated/prisma/client";
import { UserRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const studentSelect = {
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      studentId: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.StudentSelect;

const getAllStudents = () =>
  prisma.student.findMany({
    where: { user: { role: UserRole.STUDENT } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: studentSelect,
  });

const getSingleStudent = async (id: string) => {
  const student = await prisma.student.findFirst({
    where: { id, user: { role: UserRole.STUDENT } },
    select: studentSelect,
  });
  if (!student) {
    throw new APIError("NOT_FOUND", { message: "Student not found." });
  }
  return student;
};

export const StudentService = { getAllStudents, getSingleStudent };
