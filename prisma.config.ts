import { defineConfig } from "prisma/config";
import { envVariables } from "./src/config/env";

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: envVariables.DIRECT_URL,
  },
});
