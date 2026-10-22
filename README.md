# Backend

Express server written in TypeScript.

Install dependencies and start the development server with automatic restarts:

```sh
npm install
npm run dev
```

The server defaults to `http://localhost:3000`. To configure the port, create a
`.env` file in the project root:

```dotenv
PORT=4000
```

Restart the development server after changing `.env`. You can also set `PORT`
directly in the shell; it takes precedence over `.env`:

```sh
PORT=4000 npm run dev
```

For Neon, configure both database URLs in `.env` using the connection strings
from the Neon console. `DATABASE_URL` is the pooled connection for the app.
`DIRECT_URL` is the direct connection for Prisma CLI commands; its hostname
omits `-pooler`. Add `connect_timeout=15` to `DIRECT_URL` to allow time for an
idle database to wake up. See `.env.example` for the required variables.

Create and apply development migrations, then regenerate the Prisma client:

```sh
npx prisma migrate dev --name init
npx prisma generate
```

Available endpoints:

- `GET /` returns a welcome message.
- `GET /health` returns `{ "status": "ok" }`.
- `POST /api/v1/auth/create-student` registers a student and returns `201`; duplicate emails
  return `422`, and invalid requests return `400`.
- `POST /api/v1/user` uses the same student creation service for compatibility.
- `POST /api/auth/sign-in/email` signs in with email and password.
- `GET /api/auth/get-session` returns the current session and user.

Better Auth is mounted before `express.json()` so it can read request bodies.
Set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters and
`BETTER_AUTH_URL` to the server URL, as shown in `.env.example`.

Test student registration (adjust the port to match `.env`):

```sh
curl -X POST http://localhost:3000/api/v1/auth/create-student \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Student","email":"student@example.test","password":"TestPassword123!"}'
```

Student registration requires a name, valid email, and a password with 8 to 128
characters. A student ID is generated automatically when the account is created:
`STU-001`, `STU-002`, and so on. Do not include `studentId` in the request;
client-provided IDs are ignored. The ID stays the same on later logins.

A PostgreSQL sequence prevents duplicate IDs during concurrent registrations and
starts after existing numeric `STU-` IDs. Numbers can have gaps after failed
registrations; existing accounts are not renumbered. The padding is a minimum of
three digits, so numbering continues correctly after `STU-999` as `STU-1000`.

Users have the `ADMIN`, `MENTOR`, or `STUDENT` role, defaulting to `STUDENT`.
Student registration follows the auth module's route, controller, and service.
`AuthService.createStudent` validates the request, hashes the password using Better
Auth's configured hasher, and creates the user, credential account, and student
profile in one Prisma transaction. Student ID allocation is part of this service;
`auth.ts` contains configuration without user creation hooks.

The `Student` model has a unique `userId` relation to `User`. Names, emails, roles,
and student IDs stay on the user record. New records use UUIDs. The `role`,
`studentId`, and `createdById` fields are controlled by the server; extra request
fields are ignored during registration. Better Auth's generic sign-up endpoint
is disabled so registration always creates the student profile. Use its sign-in
and session endpoints after registering.

The optional `createdById` relation records who created an account. Deleting the
creator clears this reference without deleting the accounts they created.
Students require a non-empty student ID, while mentors and admins can have a
null student ID. Better Auth stores password hashes in `Account.password`;
the user model and user responses do not contain passwords.

Apply the pending migrations and regenerate the Prisma client after pulling
these schema changes:

```sh
npx prisma migrate deploy
npx prisma generate
```

Lint, check types, build, and run the compiled server:

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

ESLint uses the recommended JavaScript and TypeScript rules and ignores generated
build and Prisma Client files.

TypeScript stays on the `6.0.x` release line for compatibility with
`typescript-eslint`.
