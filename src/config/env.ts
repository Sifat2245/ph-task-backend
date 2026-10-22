import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  SEED_ADMIN_PASSWORD: string;
  SEED_MENTOR_PASSWORD: string;
}

const localEnvVariables = (): EnvConfig => {
  const requiredEnvVariables = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "DIRECT_URL",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
  ];

  requiredEnvVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(`Environment variable ${variable} is required`);
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    DIRECT_URL: process.env.DIRECT_URL as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    SEED_MENTOR_PASSWORD: process.env.SEED_MENTOR_PASSWORD || "Mentor123!",
  };
};

export const envVariables = localEnvVariables();
