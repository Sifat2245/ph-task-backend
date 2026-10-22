-- Restore application fields alongside Better Auth's user fields.
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MENTOR', 'STUDENT');

ALTER TABLE "user"
ADD COLUMN "studentId" TEXT,
ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN "createdById" TEXT;

-- Continue the existing sequence and assign IDs to existing Better Auth users.
WITH student_ids AS (
    SELECT "id", nextval('student_id_sequence'::regclass)::text AS number
    FROM "user"
    WHERE "role" = 'STUDENT' AND "studentId" IS NULL
)
UPDATE "user"
SET "studentId" = 'STU-' || lpad(student_ids.number, GREATEST(3, length(student_ids.number)), '0')
FROM student_ids
WHERE "user"."id" = student_ids."id";

CREATE UNIQUE INDEX "user_studentId_key" ON "user"("studentId");
CREATE INDEX "user_createdById_idx" ON "user"("createdById");

ALTER TABLE "user" ADD CONSTRAINT "user_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user" ADD CONSTRAINT "user_studentId_required_for_students"
CHECK (
    "role" <> 'STUDENT'::"UserRole"
    OR ("studentId" IS NOT NULL AND length(btrim("studentId")) > 0)
);
