-- CreateTable
CREATE TABLE "review" (
    "id" TEXT NOT NULL,
    "revisionId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "marks" INTEGER NOT NULL,
    "examineFeedback" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_revisionId_idx" ON "review"("revisionId");

-- CreateIndex
CREATE INDEX "review_mentorId_idx" ON "review"("mentorId");

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "submission_revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
