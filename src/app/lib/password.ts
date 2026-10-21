import { randomBytes, scrypt } from "node:crypto";

const cost = 2 ** 15;
const blockSize = 8;
const parallelism = 3;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: cost, r: blockSize, p: parallelism, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });

  return ["scrypt", cost, blockSize, parallelism, salt, key.toString("hex")].join("$");
}
