// Creates (or resets the password of) an admin user.
//
//   SEED_ADMIN_EMAIL=owner@instamark.in SEED_ADMIN_PASSWORD='…' npm run admin:create
//   npm run admin:create -- --email owner@instamark.in --name "Owner" --role ADMIN
//
// The password is read from SEED_ADMIN_PASSWORD only (never from argv, so it
// does not end up in shell history or process listings).

import { PrismaClient } from "@prisma/client";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/server/auth/password.js";

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const email = (arg("email") ?? process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = arg("name") ?? process.env.SEED_ADMIN_NAME ?? "Administrator";
const role = (arg("role") ?? "ADMIN").toUpperCase();
const password = process.env.SEED_ADMIN_PASSWORD ?? "";

if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Provide a valid email via --email or SEED_ADMIN_EMAIL.");
  process.exit(1);
}
if (password.length < PASSWORD_MIN_LENGTH) {
  console.error(`SEED_ADMIN_PASSWORD must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  process.exit(1);
}
if (!["ADMIN", "EDITOR"].includes(role)) {
  console.error("--role must be ADMIN or EDITOR.");
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await hashPassword(password);
  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, name, role, passwordHash },
    update: { passwordHash, isActive: true, failedLoginCount: 0, lockedUntil: null },
  });
  console.log(`✓ Admin user ready: ${user.email} (${user.role})`);
} finally {
  await prisma.$disconnect();
}
