-- Better Auth registers the user before the service creates the student profile.
-- The profile transaction assigns a student ID; on failure the service deletes
-- the newly registered user and its cascading accounts and sessions.
ALTER TABLE "user" DROP CONSTRAINT "user_studentId_required_for_students";

ALTER TABLE "user" ADD CONSTRAINT "user_studentId_nonempty"
CHECK (
    "role" <> 'STUDENT'::"UserRole"
    OR "studentId" IS NULL
    OR length(btrim("studentId")) > 0
);
