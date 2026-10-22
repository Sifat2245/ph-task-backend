import type { User } from "../../../generated/prisma/client";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

const createUser = async (
  payload: CreateUserInput,
): Promise<Omit<User, "passwordHash">> => {
  const passwordHash = await hashPassword(payload.password);
  const [sequence] = await prisma.$queryRaw<{ nextId: bigint }[]>`
    SELECT nextval('student_id_sequence'::regclass) AS "nextId"
  `;

  if (!sequence) throw new Error("Unable to generate a student ID.");

  return prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash,
      studentId: `STU-${sequence.nextId.toString().padStart(3, "0")}`,
    },
    omit: { passwordHash: true },
  });
};

const getUsers = async (): Promise<User[]> => {
  return prisma.user.findMany();
};

export const UserService = {
  createUser,
  getUsers,
};
