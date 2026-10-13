// Runs `prisma migrate deploy` before the Vercel build — but only when a
// database is configured, so preview builds without a DB still succeed.
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  console.log("[migrate] DATABASE_URL/DIRECT_URL not set — skipping migrations (content mode).");
  process.exit(0);
}

console.log("[migrate] applying pending migrations…");
execSync("npx prisma migrate deploy", { stdio: "inherit" });
