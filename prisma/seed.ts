import { UserRole } from "../src/generated/prisma/enums";
import { auth } from "../src/app/lib/auth";
import { prisma } from "../src/app/lib/prisma";
import { envVariables } from "../src/config/env";
import { assignments } from "./seed-data";

type SeedAccount = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MENTOR";
  createdById?: string;
};

const seedAccount = async (account: SeedAccount) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: account.email },
  });

  if (existingUser) {
    if (existingUser.role !== account.role) {
      throw new Error(
        `Seed email ${account.email} already belongs to a ${existingUser.role} account; its role was not changed.`,
      );
    }

    const credential = await prisma.account.findFirst({
      where: {
        userId: existingUser.id,
        providerId: "credential",
        accountId: existingUser.id,
      },
      select: { password: true },
    });

    if (!credential?.password) {
      throw new Error(`Existing seed account ${account.email} has no password.`);
    }

    console.log(`Kept existing ${account.role}: ${account.email}`);
    return existingUser;
  }

  const { user: registeredUser } = await auth.api.signUpEmail({
    body: {
      name: account.name,
      email: account.email,
      password: account.password,
    },
  });

  try {
    const user = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: registeredUser.id },
        data: {
          role: account.role,
          studentId: null,
          createdById: account.createdById ?? null,
        },
      });

      // Seed accounts should not start with an active sign-in session.
      await tx.session.deleteMany({ where: { userId: user.id } });

      return user;
    });

    console.log(`Created ${account.role}: ${user.email}`);
    return user;
  } catch (error) {
    try {
      await prisma.user.delete({ where: { id: registeredUser.id } });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        `Failed to seed and clean up ${account.email}.`,
        { cause: cleanupError },
      );
    }

    throw error;
  }
};

const main = async () => {
  const admin = await seedAccount({
    name: "Admin",
    email: "admin@example.com",
    password: envVariables.SEED_ADMIN_PASSWORD,
    role: UserRole.ADMIN,
  });

  for (let index = 1; index <= 5; index++) {
    await seedAccount({
      name: `Mentor ${index}`,
      email: `mentor${index}@example.com`,
      password: envVariables.SEED_MENTOR_PASSWORD,
      role: UserRole.MENTOR,
      createdById: admin.id,
    });
  }

  await prisma.$transaction(
    assignments.map((assignment) =>
      prisma.assignment.upsert({
        where: { assignmentNumber: assignment.assignmentNumber },
        create: assignment,
        update: assignment,
      }),
    ),
  );

  console.log("Seed complete: 5 assignments, 1 admin, and 5 mentors.");
};

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
