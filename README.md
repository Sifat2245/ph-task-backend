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

JWT helpers use `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` from `.env`.
`tokenUtils.getAccessToken(payload)` expires after one day, and
`tokenUtils.getRefreshToken(payload)` expires after seven days by default.
Set `JWT_ACCESS_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN` to change those durations
(for example, `1d` and `7d`). Both helpers use `jwtUtils.createToken`.

Cookie setters are available through `tokenUtils`:

```ts
tokenUtils.setAccessTokenCookie(res, result.data.accessToken);
tokenUtils.setRefreshTokenCookie(res, result.data.refreshToken);
tokenUtils.setBetterAuthSessionCookie(res, result.data.token);
```

Signup and signin set the `accessToken`, `refreshToken`, and `betterAuthSession`
cookies and return those token values in the response. Their lifetimes use
`JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, and
`BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN`. Cookies use `HttpOnly`, `Secure`, and
`SameSite=None`.

The controllers also forward Better Auth's signed session and companion cookies,
which `/api/auth/get-session` and protected routes use to resolve the session.
Logout clears the three application cookies and Better Auth's cookies.

Better Auth session lifetimes and refresh intervals use
`BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN` and
`BETTER_AUTH_UPDATE_TOKEN_EXPIRES_IN`, both defaulting to `1d`. Durations are
validated when the server starts; Express receives milliseconds and Better Auth
receives seconds.

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
- `POST /api/v1/user/create-mentor` lets an admin create a mentor.
- `GET /api/v1/user/get-all-mentors` lets an admin list all mentors.
- `PUT /api/v1/user/update-mentor/:id` lets an admin update a mentor.
- `DELETE /api/v1/user/delete-mentor/:id` lets an admin delete a mentor.
- `POST /api/v1/auth/signin` signs in using Better Auth and returns a session token
  in `data.token`, the user in `data.user`, access and refresh JWTs, and
  authentication cookies.
- `POST /api/v1/auth/logout` signs out the session identified by the request's
  cookies, deletes that session, and clears authentication cookies.
- `POST /api/auth/sign-in/email` signs in with email and password.
- `GET /api/auth/get-session` returns the current session and user.

Better Auth is mounted before `express.json()` so it can read request bodies.
Set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters and
`BETTER_AUTH_URL` to the server URL, as shown in `.env.example`.

Mentor management requires the signed-in admin's session and access token cookies.
The middleware verifies the access JWT's signature and expiration and requires
its `userId` to match the session user. Missing, invalid, expired, or mismatched
credentials return `401`; authenticated students and mentors receive `403`.
Refresh tokens are reserved for renewing access tokens and do not authorize
protected requests. The middleware
reads `betterAuthSession` with `cookieUtils` and looks up an unexpired Prisma
session including its user. It checks the user's current database role and also
accepts Better Auth's verified signed session cookie when the application cookie
is absent. Admins and students cannot
be updated or deleted through the mentor routes; those IDs return `404`.

Create a mentor with `name`, `email`, `password`, and an optional `image` URL.
`UserService.createUser` uses Better Auth's `signUpEmail`, then a Prisma
transaction sets the `MENTOR` role and the admin's `createdById`, and removes the
mentor's automatic signup session. It deletes the newly registered user if this
transaction fails. The response contains the mentor; the admin stays signed in.

Updates accept any non-empty combination of `name`, `email`, `password`, and
`image`; use `image: null` to clear the image. Password changes use Better Auth's
configured password hasher. Email and password changes revoke the mentor's
sessions in the same transaction; changing email also clears `emailVerified`.
Duplicate email updates return `409`, and duplicate signup emails return `422`.
The mentor's role, creator, and student ID cannot be set in the request body.
Deleting a mentor also deletes their credential accounts and sessions.

For example, after signing in as the admin and saving cookies to `cookies.txt`:

```sh
curl -b cookies.txt -X POST http://localhost:3000/api/v1/user/create-mentor \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Mentor","email":"newmentor@example.com","password":"MentorPassword123!"}'

curl -b cookies.txt http://localhost:3000/api/v1/user/get-all-mentors

curl -b cookies.txt -X PUT http://localhost:3000/api/v1/user/update-mentor/MENTOR_USER_ID \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated Mentor"}'

curl -b cookies.txt -X DELETE http://localhost:3000/api/v1/user/delete-mentor/MENTOR_USER_ID
```

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

Successful registration returns `data.token`, `data.session`, `data.user`, `data.student`,
`data.accessToken`, and `data.refreshToken`.
`data.token` and `data.session.token` are Better Auth's session token. Controllers forward
Better Auth's `Set-Cookie` headers after the profile transaction succeeds, so the
returned cookies can immediately be used with `/api/auth/get-session`. Failed
registration does not forward authentication cookies.

Registration omits the initial session cache cookie, whose user data predates the
student profile transaction, so the next session lookup reads the completed user.

Both signup and signin return `data.accessToken` (one day by default) and
`data.refreshToken` (seven days by default). These JWTs contain `userId`, `email`,
and `role`, signed using the corresponding secrets configured in `.env`.
Signup generates JWTs within the student profile transaction; if generation
fails, registration is rolled back and the new Better Auth user is deleted.
If JWT generation fails during signin, its newly created session is deleted.
Protected routes validate Better Auth's session cookies.

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
