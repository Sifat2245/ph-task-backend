-- CreateEnum
CREATE TYPE "SubmissionProgressState" AS ENUM ('SUBMITTED', 'SKIPPED');

-- CreateTable
CREATE TABLE "assignment_submission_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "state" "SubmissionProgressState" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_submission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_revision" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submission_items" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_submission_progress_assignmentId_idx" ON "assignment_submission_progress"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submission_progress_studentId_assignmentId_key" ON "assignment_submission_progress"("studentId", "assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_revision_submissionId_version_key" ON "submission_revision"("submissionId", "version");

-- AddForeignKey
ALTER TABLE "assignment_submission_progress" ADD CONSTRAINT "assignment_submission_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submission_progress" ADD CONSTRAINT "assignment_submission_progress_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_revision" ADD CONSTRAINT "submission_revision_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
