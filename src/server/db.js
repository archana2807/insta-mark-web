// Prisma client singleton (avoids exhausting connections during dev reloads).
// Only *.repository.js files may import this (ESLint enforces it).
import "server-only";
import { isDatabaseConfigured } from "@/server/config/env";

let prismaPromise;

/** @returns {Promise<import("@prisma/client").PrismaClient>} */
export async function getPrisma() {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalThis.__prisma) {
    prismaPromise ??= import("@prisma/client").then(({ PrismaClient }) => new PrismaClient());
    globalThis.__prisma = await prismaPromise;
  }
  return globalThis.__prisma;
}
