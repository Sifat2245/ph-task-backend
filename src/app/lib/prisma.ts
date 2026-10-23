import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { envVariables } from "../../config/env.js";

const adapter = new PrismaPg({ connectionString: envVariables.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
