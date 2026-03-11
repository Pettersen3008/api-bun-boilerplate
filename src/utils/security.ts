import { env } from "../provider/config";

export async function hashPassword(plain: string): Promise<string> {
  if (env.PASSWORD_HASH_ALGORITHM === "bcrypt") {
    return Bun.password.hash(plain, {
      algorithm: "bcrypt",
      cost: env.PASSWORD_BCRYPT_COST,
    });
  }

  return Bun.password.hash(plain, {
    algorithm: env.PASSWORD_HASH_ALGORITHM,
    memoryCost: env.PASSWORD_ARGON_MEMORY_COST,
    timeCost: env.PASSWORD_ARGON_TIME_COST,
  });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return Bun.password.verify(plain, hash);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function generateOpaqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
