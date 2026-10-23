# Submitly

Submitly is an assignment submission and review API for students, mentors, and
admins. Students work through assignments in order, submit projects or record a
skip, and receive feedback on individual submission revisions.

Built with TypeScript, Express 5, PostgreSQL, Prisma 7, Better Auth, and JWTs.

## Contents

- [Features and roles](#features-and-roles)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Development seed data](#development-seed-data)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Pagination](#pagination)
- [Request examples](#request-examples)
- [Assignment and review workflow](#assignment-and-review-workflow)
- [Response format](#response-format)
- [Data model and IDs](#data-model-and-ids)
- [Project structure](#project-structure)
- [Commands](#commands)

## Features and roles

| Role | Access |
| --- | --- |
| `STUDENT` | Register, access unlocked assignments, submit or skip assignments, view personal submissions, revisions, skips, and received reviews |
| `MENTOR` | Manage assignments, view students and submissions, create reviews, and view or edit their own reviews |
| `ADMIN` | Mentor permissions plus creating, listing, updating, and deleting mentor accounts |

The API enforces assignment order and role permissions on the server. Submission,
progress, revision, and review changes use Prisma transactions. Progress changes
and reviews share a student profile lock to coordinate simultaneous requests.

## Getting started

### Requirements

- Node.js 24 or newer and npm.
- A PostgreSQL database, including a hosted provider such as Neon.
- A pooled application connection and a direct migration connection when the
  database provider supplies both.

### 1. Configure the environment

From the repository root:

```sh
cp .env.example .env
```

Set `DATABASE_URL`, `DIRECT_URL`, and three independent secrets:
`BETTER_AUTH_SECRET`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`. Keep
`BETTER_AUTH_URL` consistent with the server's origin and configured `PORT`.

Generate a random secret with Node.js; run this separately for each secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Application configuration is loaded and validated by [src/config/env.ts](src/config/env.ts).
The `.env` file is ignored by Git; [.env.example](.env.example) documents the
available settings.

The Prisma CLI loads `.env` separately through [prisma.config.ts](prisma.config.ts)
and reads only `DIRECT_URL`. Client generation and compilation can run without
application environment variables; database commands still require `DIRECT_URL`.
For Vercel, add the required runtime variables in the project's **Settings →
Environment Variables**, including `NODE_ENV=production`, before deploying.

### 2. Install dependencies and prepare the database

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm run seed
```

`migrate deploy` applies the migrations already included in this repository.
Seeding creates the development accounts and assignments listed below. Prisma
Client is generated into `src/generated/prisma`, which is ignored by Git.

### 3. Start the development server

```sh
npm run dev
```

The example configuration uses `http://localhost:3000`. Check the server with:

```sh
curl http://localhost:3000/health
```

The health endpoint returns `{ "status": "ok" }` and does not query the database.

### 4. Build and run the compiled application

```sh
npm run build
npm start
```

The compiled entry point is `dist/src/server.js` and runs directly with Node.js.
Local imports use explicit `.js` extensions, including Prisma's generated
imports, so the compiled ESM also works in Vercel's Node.js runtime. TypeScript's
`NodeNext` configuration checks these imports during compilation. Development
and seeding still use `tsx` to run the TypeScript source files.

## Environment variables

| Variable | Purpose | Default or example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment; required | `development` |
| `PORT` | HTTP server port; required | `3000` |
| `FRONTEND_URL` | Frontend origin allowed by credentialed CORS and Better Auth | `http://localhost:3000` |
| `COOKIE_DOMAIN` | Optional parent domain for sharing auth cookies across frontend/API subdomains | `.submitly.example` |
| `DATABASE_URL` | Application PostgreSQL connection; required | Pooled URL when available |
| `DIRECT_URL` | PostgreSQL connection used by Prisma CLI; required | Direct URL |
| `BETTER_AUTH_URL` | Backend origin used by Better Auth; required | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Better Auth signing secret; required | Independent random secret, at least 32 characters |
| `JWT_ACCESS_SECRET` | Access JWT signing secret; required | Independent random secret |
| `JWT_REFRESH_SECRET` | Refresh JWT signing secret; required | Independent random secret |
| `JWT_ACCESS_EXPIRES_IN` | Access JWT and cookie lifetime | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh JWT and cookie lifetime | `7d` |
| `BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN` | Better Auth session lifetime | `1d` |
| `BETTER_AUTH_UPDATE_TOKEN_EXPIRES_IN` | Better Auth session update interval | `1d` |
| `SEED_ADMIN_PASSWORD` | Password for newly seeded admin accounts | `Admin123!` |
| `SEED_MENTOR_PASSWORD` | Password for newly seeded mentor accounts | `Mentor123!` |
| `SEED_STUDENT_PASSWORD` | Password for newly seeded student accounts | `Student123!` |

Durations accept values such as `1d`, `7d`, or `12h`, and must be at least one
second. Restart the server after changing `.env`. Existing process environment
variables take precedence over values in the file.

For Neon, use the pooled connection for `DATABASE_URL` and the direct connection
for `DIRECT_URL`. The example direct URL includes `connect_timeout=15` to allow
an idle database time to wake up.

## Development seed data

```sh
npm run seed
```

### Accounts

| Role | Email | Default password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Mentors | `mentor1@example.com` through `mentor5@example.com` | `Mentor123!` |
| Students | `student1@example.com` through `student10@example.com` | `Student123!` |

Set the `SEED_*_PASSWORD` variables before seeding to choose passwords for new
accounts. Account creation uses Better Auth. Each student receives a `Student`
profile and a generated public code such as `STU-001`. Newly seeded mentors and
students reference the seeded admin as their creator, and their automatic signup
sessions are removed.

### Assignments

| Number | Assignment | Maximum marks |
| --- | --- | --- |
| 1 | Personal Portfolio Website | 50 |
| 2 | Task Management Application | 50 |
| 3 | Product Listing Dashboard | 50 |
| 4 | Full-Stack Blog Application | 50 |
| 5 | Final Full-Stack Project | 60 |

Rerunning the seed updates assignment definitions by assignment number while
preserving existing account IDs, student codes, profiles, passwords, and
sessions. It stops if an existing seed account has an unexpected role, missing
credentials, or an incomplete student profile.

Source: [prisma/seed.ts](prisma/seed.ts) and
[prisma/seed-data.ts](prisma/seed-data.ts). Seeding does not create submissions,
skips, or reviews.

## Authentication

Use the custom auth routes under `/api/v1/auth` for registration and login.
They use Better Auth for credentials and sessions and issue the application's
access and refresh JWTs.

Register a student with:

```json
{
  "name": "Example Student",
  "email": "student@example.com",
  "password": "StudentPassword123!"
}
```

Send this body to `POST /api/v1/auth/signup`. Registration creates the student
profile and public student code. Role, profile IDs, and creator information are
controlled by the server. If profile creation fails, the newly created Better
Auth user is removed along with its dependent auth records.

Sign in and save the cookies:

```sh
curl -c cookies.txt http://localhost:3000/api/v1/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"student1@example.com","password":"Student123!","rememberMe":true}'

curl -b cookies.txt http://localhost:3000/api/v1/assignment/get-all-assignments
```

All roles use the same signin endpoint. `rememberMe` is optional and defaults to
`true`. Signup and signin return `data.token`, `data.user`, `data.accessToken`,
and `data.refreshToken`. Signup also returns `data.student` and `data.session`.

Protected business routes require both a valid access JWT and an unexpired
Better Auth session belonging to the same user. The middleware checks the user's
current database role. The controllers set `accessToken`, `refreshToken`, and
`betterAuthSession` cookies and forward Better Auth's signed session cookies.

Cookies remain `HttpOnly`. Development uses `SameSite=Lax` on local HTTP;
production uses `Secure` and `SameSite=None` and requires HTTPS. Browser clients
send cookies with `credentials: "include"` or Axios `withCredentials: true`.
Credentialed CORS and Better Auth trust the configured `FRONTEND_URL` and the
backend origin. Preflight requests are handled before Better Auth routes.
Use the same hostname on both local ports. If frontend server-side rendering
needs cookies across production subdomains, set `COOKIE_DOMAIN` to their shared
parent domain; leave it unset for host-only cookies.

`GET /api/auth/get-session` is provided by Better Auth and returns its native
session/user response. The native HTTP signup route `/api/auth/sign-up/email` is
blocked to keep student profile creation in the application service. Use the
custom signin route to receive the access JWT required by protected routes.

Refresh JWTs are issued, but a refresh-token exchange endpoint has not been
implemented. Sign in again when access credentials expire.

Log out and clear the cookie jar:

```sh
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/v1/auth/logout
```

Logout removes the current session and clears its cookies while preserving other
sessions and the user account.

## API reference

The following custom endpoints use the `/api/v1` prefix. Protected requests need
the authentication cookies described above.

### Authentication

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/v1/auth/signup` | Public; creates a student |
| POST | `/api/v1/auth/signin` | Public; all roles |
| POST | `/api/v1/auth/logout` | Current session |

### Mentor management

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/v1/user/create-mentor` | Admin |
| GET | `/api/v1/user/get-all-mentors` | Admin |
| PUT | `/api/v1/user/update-mentor/:id` | Admin |
| DELETE | `/api/v1/user/delete-mentor/:id` | Admin |

Mentor `:id` values are `User.id` UUIDs. Email or password updates revoke the
mentor's sessions; an email change also clears `emailVerified`. Deleting a mentor
with review records returns `409` to preserve review history.

### Student directory

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/v1/student/get-all-students` | Admin, mentor |
| GET | `/api/v1/student/get-single-student/:id` | Admin, mentor |

Use the `Student.id` profile UUID returned as `data[].id` by the list. Responses
include profile information and a nested `user` with name, email, image, public
student code, role, and timestamps. Authentication records are excluded. Lists
contain only profiles whose user currently has the `STUDENT` role, newest first.
The list is paginated; see [Pagination](#pagination) for query parameters and metadata.

### Assignment management

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/v1/assignment/get-all-assignments` | All signed-in roles |
| GET | `/api/v1/assignment/get-single-assignment/:id` | All signed-in roles; student lock rules apply |
| POST | `/api/v1/assignment/create-assignment` | Admin, mentor |
| PUT | `/api/v1/assignment/update-assignment/:id` | Admin, mentor |
| DELETE | `/api/v1/assignment/delete-assignment/:id` | Admin, mentor |

Assignments are listed by `assignmentNumber` ascending. Student list responses
include `isLocked` and `progressState`. Locked items retain their title, number,
and maximum marks, with `description: null`; their detail route returns `403`.
Admins and mentors can read every assignment. Deleting an assignment with
submission, skip, or progress records returns `409`.

### Student submissions and skips

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/v1/assignment-submission/submit-assignment` | Student |
| GET | `/api/v1/assignment-submission/get-my-submission/:assignmentId` | Student; own record |
| POST | `/api/v1/submission-skip/skip-assignment` | Student |
| GET | `/api/v1/submission-skip/get-my-skip/:assignmentId` | Student; own record |

The student comes from the authenticated session. The submission GET includes
revisions and received reviews, newest first, with each reviewer's ID and name.
The skip GET returns the latest historical skip, even if the assignment was
subsequently submitted. Missing personal records return `404`; locked
assignments return `403` on reads and writes.

### Submission reviews

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/v1/assignment-review/get-all-submissions` | Admin, mentor |
| GET | `/api/v1/assignment-review/get-single-submission/:id` | Admin, mentor |
| POST | `/api/v1/assignment-review/create-review` | Admin, mentor |
| GET | `/api/v1/assignment-review/get-my-reviews` | Admin, mentor; own reviews |
| GET | `/api/v1/assignment-review/get-my-review/:id` | Admin, mentor; own review |
| PUT | `/api/v1/assignment-review/update-review/:id` | Admin, mentor; own review |

The submission list contains actual submissions and their latest revisions,
excluding skips and submission records without revisions. The detail route
includes all revisions and every review's marks, feedback, review date, and
reviewer ID/name, newest first. Both views include student and assignment
details. The list includes the signed-in reviewer's reviews; submission details
include all reviewers' reviews so admins and mentors can see the same feedback.
The submission list is paginated and its total counts submissions, excluding
skips and records without revisions.

Use a submission UUID for `get-single-submission/:id`, a revision UUID to create
a review, and a review UUID to view or update a review. Reviewers can edit only
their own reviews, including admins; another reviewer's ID returns `404`.

## Pagination

The student list and staff submission list accept `page` and `limit`:

```http
GET /api/v1/student/get-all-students?page=2&limit=5
GET /api/v1/assignment-review/get-all-submissions?page=2&limit=5
```

Both routes default to `page=1` and `limit=10`. Values must be positive integers,
and `limit` cannot exceed `100`. Invalid, repeated, or excessively large
pagination values return `400`. Both endpoints remain restricted to admins and
mentors.

Responses keep `data` as an array and include a top-level `meta` object:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Students fetched successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  },
  "data": []
}
```

`total` is the number of matching records across all pages. `totalPages` is
`Math.ceil(total / limit)`. Empty collections and pages beyond the last page
return `200` with `data: []`; the requested page is preserved in `meta`. Counts
and page records are read in one consistent database snapshot. Existing ordering
is preserved with a UUID tie-breaker. Other endpoints omit `meta`.

## Request examples

### Create or update a mentor

```json
{
  "name": "Example Mentor",
  "email": "mentor@example.com",
  "password": "MentorPassword123!",
  "image": "https://example.com/avatar.png"
}
```

Creation requires `name`, `email`, and `password`; `image` is optional. Updates
accept any non-empty combination of these fields, including `image: null` to
clear the image. Passwords must satisfy Better Auth's configured length limits
(currently 8–128 characters).

### Create or update an assignment

```json
{
  "assignmentNumber": 6,
  "title": "Realtime Chat Application",
  "description": "Build and deploy a chat application with authentication.",
  "maxMarks": 60
}
```

Creation requires all four fields. `assignmentNumber` must be a unique positive
integer, and `maxMarks` must be a positive integer. Text must be non-blank.
Updates accept any non-empty subset of these fields.

### Submit an assignment

```json
{
  "assignmentId": "ASSIGNMENT_UUID",
  "submissionItems": "https://github.com/example/portfolio",
  "note": "Deployed portfolio and source code."
}
```

`submissionItems` is a required string; `note` is also required. Both are trimmed
and must be non-blank. A successful response contains `submission`, `revision`,
`progress`, and `nextAssignment`.

### Skip an assignment

```json
{
  "assignmentId": "ASSIGNMENT_UUID",
  "reason": "I need more time to practice this topic."
}
```

The reason is required and trimmed. A successful response contains `skip`,
`progress`, and `nextAssignment`. The next assignment contains its ID, number,
and title, or is `null` after the final assignment.

### Create or edit a review

```json
{
  "revisionId": "REVISION_UUID",
  "marks": 45,
  "examineFeedback": "Good implementation. Improve form accessibility."
}
```

Marks must be integers from `0` to the assignment's `maxMarks`, inclusive.
Feedback is required and trimmed. The reviewer comes from the session; the
existing `mentorId` field stores the reviewer's user UUID for mentors and admins.

The update route accepts `marks`, `examineFeedback`, or both. It refreshes
`reviewedAt` and rejects an empty update. Reviewer, revision, and review IDs
cannot be changed. Each reviewer can create one review per revision through the
service; duplicates return `409`, so use the update route to edit a review.
Different reviewers can review the same revision.

Assignment, mentor, submission, skip, and review management reject unsupported
write fields. IDs, timestamps, roles, revision numbers, and progress states are
controlled by the server.

## Assignment and review workflow

1. A student starts with the first assignment unlocked.
2. Submitting or skipping it records `SUBMITTED` or `SKIPPED` progress and unlocks
   the next assignment immediately. A mentor review is not required to proceed.
3. Every earlier assignment must have progress before a later assignment can be
   read, submitted, or skipped. Ordering follows assignment numbers and supports
   gaps between numbers.
4. Resubmitting adds the next numbered revision to the same submission and sets
   its review status to `PENDING`, preserving previous revisions and reviews.
5. A skipped assignment can be submitted later; the skip remains as history.
   Submitted assignments cannot be skipped, and repeating a skip returns `409`.
6. Reviewing the latest revision sets the submission to `REVIEWED`. Creating or
   editing a historical review does not mark a newer revision reviewed.

The two enums serve different purposes:

| Enum | Values | Meaning |
| --- | --- | --- |
| `SubmissionProgressState` | `SUBMITTED`, `SKIPPED` | The student's action and progression |
| `SubmissionStatus` | `PENDING`, `REVIEWED` | Review state of the submission's latest revision |

Submit, skip, and review writes run in transactions. Failed writes leave progress
and review state unchanged. Student profile row locks serialize related writes
so concurrent submissions, duplicate reviews, and review/resubmission races are
handled consistently through these services.

## Response format

Custom `/api/v1` routes use the same JSON response structure. `statusCode` matches
the HTTP status. Successful responses include `data`; error responses omit it.
Paginated list responses also include `meta`, as described in [Pagination](#pagination).

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Assignments fetched successfully",
  "data": []
}
```

```json
{
  "statusCode": 403,
  "success": false,
  "message": "Submit or skip assignment 1 to unlock this assignment."
}
```

| Status | Meaning |
| --- | --- |
| `200` | Successful read, update, signin, or logout |
| `201` | Student, mentor, assignment, submission, skip, or review created |
| `400` | Invalid UUID, payload, marks, or malformed JSON |
| `401` | Missing, invalid, expired, or mismatched authentication |
| `403` | Role restriction, missing student profile, or locked assignment |
| `404` | Missing record, non-owned review, or missing personal submission/skip |
| `409` | Duplicate assignment/review/skip, duplicate email update, or protected deletion |
| `422` | Duplicate email during Better Auth signup |
| `500` | Unexpected server error |

Empty collection responses return `data: []`. Better Auth's native routes and
`GET /health` use their own response formats.

## Data model and IDs

Prisma models are split across [prisma/schema](prisma/schema).

| Model | Purpose |
| --- | --- |
| `User` | Identity, email, role, public student code, and creator reference |
| `Student` | Student profile linked one-to-one with a user |
| `Assignment` | Numbered assignment definition and maximum marks |
| `AssignmentSubmission` | A student's submission and current review status |
| `SubmissionRevision` | Numbered content, note, and submission timestamp |
| `SubmissionSkip` | Skip reason and timestamp |
| `SubmissionProgress` | One current state per student/assignment pair |
| `AssignmentReview` | Revision marks, feedback, reviewer, and review timestamp |
| `Session`, `Account`, `Verification` | Better Auth records, including credential password hashes |

Use the correct identifier for each endpoint:

| Identifier | Use |
| --- | --- |
| `User.id` | Mentor management and reviewer identity |
| `Student.id` | Student detail route and student foreign keys |
| `User.studentId` | Public display code, such as `STU-001` |
| `Assignment.id` | Assignment routes and submit/skip payloads |
| `AssignmentSubmission.id` | Staff single-submission route |
| `SubmissionRevision.id` | `revisionId` when creating a review |
| `AssignmentReview.id` | Personal review detail and update routes |

Record IDs are UUIDs. Public student codes are generated by a PostgreSQL
sequence; numbers may have gaps after failed registrations, and padding grows
beyond three digits when needed. Referenced student, assignment, submission,
revision, and reviewer records are protected by foreign keys to preserve history.

## Project structure

```text
prisma/
  schema/                 Split Prisma models and enums
  migrations/             Versioned SQL migrations
  seed.ts                 Development account and assignment seeding
  seed-data.ts            Seed assignment definitions
src/
  app.ts                  Express setup and route mounting
  server.ts               Server entry point
  config/env.ts           Validated environment configuration
  app/
    lib/                  Better Auth and Prisma setup
    middleware/           Authentication and error handling
    module/
      auth/
      user/               Admin mentor management
      student/            Staff student directory
      assignment/
      assignmentSubmission/
      submissionSkip/
      assignmentReview/
    router/               API module registration
    shared/               Async handler and response helpers
    utils/                JWT, token, and cookie helpers
  generated/prisma/       Generated Prisma Client; ignored by Git
```

Modules follow the route → controller → service → validation structure. Controllers
use `sendResponse` and `http-status`; errors flow through `CatchAsync` to the
shared global error handler.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the TypeScript server with automatic restarts |
| `npm run lint` | Check application and Prisma TypeScript files with ESLint |
| `npm run typecheck` | Check TypeScript without writing build output |
| `npm run build` | Generate Prisma Client, then compile the server and Prisma TypeScript files into `dist/` |
| `npm start` | Run the compiled server with the installed `tsx` loader |
| `npm run seed` | Seed development accounts and assignment definitions |
| `npx prisma generate` | Regenerate Prisma Client after schema changes |
| `npx prisma migrate deploy` | Apply the existing migrations |
| `npx prisma migrate dev --name describe_change` | Create and apply a new development migration |

Run the repository checks with:

```sh
npm run lint
npm run typecheck
npm run build
```

`npm test` is currently a placeholder and does not run a test suite. Prisma Client
is generated by the `postinstall` script and before compilation during a build.
Database migrations and seeding remain explicit commands. The server does not
run generation, migrations, or seeding automatically at startup.
