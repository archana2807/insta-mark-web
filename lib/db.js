// Prisma client singleton (avoids exhausting connections during dev reloads).
// The database is optional until Phase 3: callers check isDatabaseConfigured().

let prismaPromise;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

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
