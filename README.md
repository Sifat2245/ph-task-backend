# Backend

Express server written in TypeScript.

Install dependencies and start the development server with automatic restarts:

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` in the project root and fill in all required values.
`src/config/env.ts` loads and validates the configuration used by the server,
Better Auth, the Prisma client, and Prisma CLI. For example, set the environment
and port with:

```dotenv
NODE_ENV=development
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

Seed the five assignments, one admin, five mentors, and ten students:

```sh
npm run seed
```

New development seed accounts use these credentials by default:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Mentor | `mentor1@example.com` through `mentor5@example.com` | `Mentor123!` |
| Student | `student1@example.com` through `student10@example.com` | `Student123!` |

Set `SEED_ADMIN_PASSWORD`, `SEED_MENTOR_PASSWORD`, and `SEED_STUDENT_PASSWORD`
in `.env` before seeding to choose different passwords for new accounts.
The seed uses Better Auth sign-up
to create credential accounts, assigns the requested roles, and records the admin
as each new mentor's creator. It removes the sessions created during seeding.
Admin and mentor accounts have a null student ID and no `Student` profile.
Students use `AuthService.createStudent` to receive a unique student ID and a
linked `Student` profile. New students also reference the admin as their creator.

Rerunning the seed updates assignments by their unique assignment number and
keeps existing account IDs, student IDs, profiles, passwords, and sessions. It
stops if a seed email belongs to a different role, has no credential password,
or is a student missing its student ID or profile. The assignment data
is stored in `prisma/seed-data.ts` and the script in `prisma/seed.ts`.

Available endpoints:

- `GET /` returns a welcome message.
- `GET /health` returns `{ "status": "ok" }`.
- `POST /api/v1/auth/signup` registers a student and returns `201`; duplicate emails
  return `422`, and invalid requests return `400`.
- `POST /api/v1/user` uses the same student creation service for compatibility.
- `POST /api/v1/auth/signin` signs in using Better Auth and returns a session token
  in `data.token`, the user in `data.user`, and authentication cookies.
- `POST /api/v1/auth/logout` signs out the session identified by the request's
  cookies, deletes that session, and clears authentication cookies.
- `POST /api/auth/sign-in/email` signs in with email and password.
- `GET /api/auth/get-session` returns the current session and user.

Better Auth is mounted before `express.json()` so it can read request bodies.
Set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters and
`BETTER_AUTH_URL` to the server URL, as shown in `.env.example`.

Test student registration (adjust the port to match `.env`):

```sh
curl -X POST http://localhost:3000/api/v1/auth/signup \
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
`AuthService.createStudent` calls `auth.api.signUpEmail`, letting Better Auth
validate credentials and create the user, credential account, and session. A
subsequent Prisma transaction assigns the student ID and creates the `Student`
profile. If this transaction fails, the catch block deletes the newly registered
user; its accounts and sessions are deleted through cascading relations.
`auth.ts` contains configuration without user creation hooks.

Successful registration returns `data.session`, `data.user`, and `data.student`.
`data.session.token` is Better Auth's session token. Controllers forward
Better Auth's `Set-Cookie` headers after the profile transaction succeeds, so the
returned cookies can immediately be used with `/api/auth/get-session`. Failed
registration does not forward authentication cookies.

Sign in and save the session cookies, then use them to log out:

```sh
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@example.test","password":"TestPassword123!","rememberMe":true}'

curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/logout
```

`rememberMe` is optional and defaults to `true`; set it to `false` for a
non-persistent session cookie. Invalid credentials return `401`, and invalid
sign-in requests return `400`. Logout is safe to repeat when the session is
already gone and leaves other sessions and the user account in place.

The `Student` model has a unique `userId` relation to `User`. Names, emails, roles,
and student IDs stay on the user record. New records use UUIDs. The `role`,
`studentId`, and `createdById` fields are controlled by the server; extra request
fields are ignored during registration. The generic HTTP sign-up endpoint is
blocked so registration always goes through the student service. Better Auth's
server-side sign-up API remains enabled for the service.

The optional `createdById` relation records who created an account. Deleting the
creator clears this reference without deleting the accounts they created.
The student ID can be null while Better Auth registration is pending. The
profile transaction assigns a non-empty student ID before registration succeeds;
mentors and admins can keep a null student ID. Better Auth stores password hashes in `Account.password`;
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
