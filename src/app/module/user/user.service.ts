import type { User } from "../../../generated/prisma/client";
import { AuthService } from "../auth/auth.service";
import { prisma } from "../../lib/prisma";

const getUsers = async (): Promise<User[]> => {
  return prisma.user.findMany();
};

export const UserService = {
  createUser: AuthService.createStudent,
  getUsers,
};
