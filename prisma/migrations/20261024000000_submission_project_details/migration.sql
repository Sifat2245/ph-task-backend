-- Required project details replace the unstructured submission text.
-- Apply to a fresh database as part of the reset/reseed workflow.
BEGIN;

DROP INDEX "submission_studentId_assignmentId_idx";

ALTER TABLE "submission_revision" DROP COLUMN "submission_items",
ADD COLUMN "description" TEXT NOT NULL,
ADD COLUMN "live_link" VARCHAR(2048) NOT NULL,
ADD COLUMN "project_name" VARCHAR(150) NOT NULL,
ADD COLUMN "repo_url" VARCHAR(2048) NOT NULL,
ALTER COLUMN "note" SET DEFAULT '';

CREATE UNIQUE INDEX "submission_studentId_assignmentId_key"
ON "submission"("studentId", "assignmentId");

COMMIT;
