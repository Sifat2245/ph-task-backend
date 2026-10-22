CREATE TABLE "student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_userId_key" ON "student"("userId");

ALTER TABLE "student" ADD CONSTRAINT "student_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Give existing student users a profile without changing their account or ID.
INSERT INTO "student" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "createdAt", "updatedAt"
FROM "user"
WHERE "role" = 'STUDENT';
