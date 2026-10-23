import { APIError } from "better-auth/api";
import type { Prisma } from "../../../generated/prisma/client.js";
import { UserRole } from "../../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { paginationUtils } from "../../utils/pagination.js";

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

const getAllStudents = async (query: Record<string, unknown> = {}) => {
  const { page, limit, skip } = paginationUtils.getPaginationOptions(query);
  const where: Prisma.StudentWhereInput = { user: { role: UserRole.STUDENT } };
  const [total, data] = await prisma.$transaction([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip,
      take: limit,
      select: studentSelect,
    }),
  ], { isolationLevel: "RepeatableRead" });
  return { data, meta: paginationUtils.getPaginationMeta(page, limit, total) };
};

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
