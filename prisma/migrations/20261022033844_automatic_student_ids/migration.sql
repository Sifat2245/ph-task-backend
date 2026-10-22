-- nextval allocates unique numbers even when students register concurrently.
CREATE SEQUENCE "student_id_sequence" AS BIGINT START WITH 1;

-- Continue after existing numeric STU- IDs without changing existing accounts.
SELECT setval(
    'student_id_sequence'::regclass,
    COALESCE(
        (SELECT MAX(substring("studentId" FROM '^STU-([0-9]+)$')::bigint) FROM "User"),
        0
    ) + 1,
    false
);
