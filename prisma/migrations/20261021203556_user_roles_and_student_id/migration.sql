-- Keep existing enum values and add the mentor role.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MENTOR';

-- Mentors and admins may have no student ID; non-null IDs remain unique.
ALTER TABLE "User" ALTER COLUMN "studentId" DROP NOT NULL;

-- Student accounts must still have a non-empty student ID.
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_required_for_students"
CHECK (
    "role" <> 'STUDENT'::"UserRole"
    OR ("studentId" IS NOT NULL AND length(btrim("studentId")) > 0)
);
