// Verifies /content data integrity: every gallery image exists on disk, its
// declared width/height match the real file, alt text is present, and no
// image is listed twice. Run: npm run check:content
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { gallery } from "../content/gallery.js";
import { categories } from "../content/categories.js";
import { home, industries, whyChooseUs } from "../content/company.js";
import { ICONS } from "../src/components/ui/icons.generated.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const seen = new Set();

// Every icon referenced in content must exist in the generated icon set.
for (const item of [...categories, ...industries, ...whyChooseUs]) {
  if (item.icon && !ICONS[item.icon]) {
    errors.push(
      `icon "${item.icon}" (${item.name ?? item.title}) missing — add it to scripts/build-icons.js and run npm run icons`,
    );
  }
}

for (const slug of Object.keys(gallery)) {
  if (!categories.some((c) => c.slug === slug))
    errors.push(`gallery key "${slug}" has no category`);
}

for (const [slug, images] of Object.entries(gallery)) {
  for (const img of images) {
    const file = path.join(root, "public", img.src);
    if (seen.has(img.src)) errors.push(`duplicate image ${img.src}`);
    seen.add(img.src);
    if (!img.alt || img.alt.length < 10) errors.push(`${img.src}: alt text missing/too short`);
    if (!fs.existsSync(file)) {
      errors.push(`${img.src}: file not found`);
      continue;
    }
    const meta = await sharp(file).metadata();
    if (meta.width !== img.width || meta.height !== img.height) {
      errors.push(
        `${img.src}: declared ${img.width}x${img.height}, actual ${meta.width}x${meta.height}`,
      );
    }
  }
  if (!images.length) console.warn(`warn: no photos yet for "${slug}"`);
}

// The logo row under the home banner: files exist and the declared sizes are real.
for (const logo of home.projectLogos) {
  const file = path.join(root, "public", logo.src);
  if (!fs.existsSync(file)) {
    errors.push(`${logo.src}: file not found`);
    continue;
  }
  const meta = await sharp(file).metadata();
  if (meta.width !== logo.width || meta.height !== logo.height) {
    errors.push(
      `${logo.src}: declared ${logo.width}x${logo.height}, actual ${meta.width}x${meta.height}`,
    );
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} content problem(s):\n  - ${errors.join("\n  - ")}`);
  process.exit(1);
}
console.log(`✓ content OK — ${seen.size} images across ${Object.keys(gallery).length} categories`);
