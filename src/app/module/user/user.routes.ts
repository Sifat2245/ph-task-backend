import { Router } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";

export const userRoutes = Router();

userRoutes.get("/", async (_req, res) => {
  const users = await prisma.user.findMany({
    omit: { passwordHash: true },
  });

  res.json(users);
});

userRoutes.post("/", async (req, res) => {
  const { studentId, name, email, password, role } = req.body ?? {};

  if (
    typeof studentId !== "string" || !studentId.trim() ||
    typeof name !== "string" || !name.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof password !== "string"
  ) {
    res.status(400).json({ message: "studentId, name, email and password are required." });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ message: "Enter a valid email address." });
    return;
  }

  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ message: "Password must contain 8 to 128 characters." });
    return;
  }

  if (role !== undefined && role !== "student") {
    res.status(400).json({ message: "Only student accounts can be registered here." });
    return;
  }

  try {
    const user = await prisma.user.create({
      data: {
        studentId: studentId.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: await hashPassword(password),
      },
      omit: { passwordHash: true },
    });

    res.status(201).json({ message: "Student account created successfully.", user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      res.status(409).json({ message: "Email or student ID already exists." });
      return;
    }

    console.error("User creation failed:", error instanceof Error ? error.name : "UnknownError");
    res.status(500).json({ message: "Unable to create the account. Please try again." });
  }
});
