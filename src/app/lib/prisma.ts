import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { envVariables } from "../../config/env";

const adapter = new PrismaPg({ connectionString: envVariables.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
