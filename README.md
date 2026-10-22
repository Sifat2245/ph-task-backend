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
- `POST /api/v1/user` registers a student and returns `201`; duplicate emails
  return `409`, and invalid requests return `400`.

JSON request bodies are enabled through `express.json()`.

Test student registration (adjust the port to match `.env`):

```sh
curl -X POST http://localhost:3000/api/v1/user \
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

Registration always creates the default `student` role; admin
and mentor account creation belongs to the future admin flow. Passwords use
salted scrypt hashes and are excluded from responses. Students require a
non-empty student ID, while mentors and admins can have a null student ID.

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
