CREATE TABLE "assignment" (
    "id" TEXT NOT NULL,
    "assignmentNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assignment_assignmentNumber_key" ON "assignment"("assignmentNumber");
