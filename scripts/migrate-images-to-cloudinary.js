// One-off migration: uploads every locally-hosted media asset (url starts with
// "/") to Cloudinary and updates `media_assets` with the Cloudinary public id,
// secure URL, real size and byte count. Safe to re-run: already-migrated
// assets are skipped.
//
//   npm run images:migrate -- --dry-run   # show the plan only
//   npm run images:migrate                # upload + update DB
//
// Env: DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// Folder layout follows docs/architecture.md §10.2.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { signParams } from "../lib/cloudinary.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY_RUN = process.argv.includes("--dry-run");

export { signParams };

async function upload(filePath, publicId) {
  const {
    CLOUDINARY_CLOUD_NAME: cloud,
    CLOUDINARY_API_KEY: key,
    CLOUDINARY_API_SECRET: secret,
  } = process.env;
  const params = {
    public_id: publicId,
    timestamp: Math.floor(Date.now() / 1000),
    overwrite: "false",
  };
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(filePath)]), path.basename(filePath));
  for (const [k, v] of Object.entries(params)) form.append(k, String(v));
  form.append("api_key", key);
  form.append("signature", signParams(params, secret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  return data;
}

async function main() {
  const missing = ["DATABASE_URL"]
    .concat(DRY_RUN ? [] : ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"])
    .filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const assets = await prisma.mediaAsset.findMany({
      where: { url: { startsWith: "/" } },
      select: {
        id: true,
        url: true,
        categoryImages: { select: { type: true, category: { select: { slug: true } } }, take: 1 },
        projectImages: { select: { project: { select: { slug: true } } }, take: 1 },
      },
    });

    console.log(`${assets.length} local asset(s) to migrate${DRY_RUN ? " (dry run)" : ""}`);
    let done = 0;
    let failed = 0;

    for (const asset of assets) {
      const file = path.join(root, "public", asset.url);
      const name = path.basename(asset.url, path.extname(asset.url));
      const ci = asset.categoryImages[0];
      const pi = asset.projectImages[0];
      const folder = ci
        ? `insta-mark/categories/${ci.category.slug}/${ci.type.toLowerCase()}`
        : pi
          ? `insta-mark/projects/${pi.project.slug}`
          : "insta-mark/misc";
      const publicId = `${folder}/${name}`;

      if (!fs.existsSync(file)) {
        console.warn(`  ✗ missing file ${asset.url}`);
        failed++;
        continue;
      }
      if (DRY_RUN) {
        console.log(`  → ${asset.url}  ⇒  ${publicId}`);
        continue;
      }
      try {
        const r = await upload(file, publicId);
        await prisma.mediaAsset.update({
          where: { id: asset.id },
          data: {
            publicId: r.public_id,
            url: r.secure_url,
            width: r.width,
            height: r.height,
            format: r.format,
            bytes: r.bytes,
          },
        });
        done++;
        console.log(`  ✓ ${asset.url}  ⇒  ${r.secure_url}`);
      } catch (err) {
        failed++;
        console.error(`  ✗ ${asset.url}: ${err.message}`);
      }
    }
    if (!DRY_RUN) console.log(`Done: ${done} migrated, ${failed} failed.`);
    if (failed) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow importing signParams in tests without running the migration.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
