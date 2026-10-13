// Seeds the database from /content (single source of truth for initial copy).
//
// Safe to run repeatedly (npm run db:seed):
//  - rows are upserted on stable unique keys, so nothing is duplicated;
//  - by default existing rows are NOT modified, so edits made later in the
//    admin panel survive a re-seed. Set SEED_OVERWRITE=true to force the
//    /content copy back over existing categories, industries and FAQs;
//  - a category's photos are only seeded while it has none (after the
//    Cloudinary migration asset ids change, so re-adding would duplicate).
//
// The first admin user is created in Phase 4 together with Auth.js.

import { Prisma, PrismaClient } from "@prisma/client";
import { categories, groupToEnum } from "../content/categories.js";
import { gallery } from "../content/gallery.js";
import { industries, faqs } from "../content/company.js";
import { site } from "../content/site.js";

const prisma = new PrismaClient();
const OVERWRITE = process.env.SEED_OVERWRITE === "true";
const overwrite = (data) => (OVERWRITE ? data : {});

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function seedCategories() {
  for (const [index, c] of categories.entries()) {
    const data = {
      name: c.name,
      shortDescription: c.shortDescription,
      group: groupToEnum[c.group],
      icon: c.icon,
      overview: c.overview,
      features: c.features,
      applications: c.applications,
      sortOrder: index + 1,
      isActive: true,
    };
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, ...data },
      update: overwrite(data),
    });
  }
  return categories.length;
}

async function seedGallery() {
  let added = 0;
  for (const [slug, images] of Object.entries(gallery)) {
    const category = await prisma.category.findUniqueOrThrow({
      where: { slug },
      select: { id: true, heroImageId: true, _count: { select: { images: true } } },
    });
    if (category._count.images > 0) continue; // already seeded / managed in admin

    for (const [index, img] of images.entries()) {
      const asset = await prisma.mediaAsset.upsert({
        // Local path acts as the public id until the Cloudinary migration.
        where: { publicId: img.src },
        create: {
          publicId: img.src,
          url: img.src,
          width: img.width,
          height: img.height,
          format: img.src.split(".").pop(),
          bytes: 0, // filled by scripts/migrate-images-to-cloudinary.js
          alt: img.alt,
        },
        update: {},
      });
      await prisma.categoryImage.create({
        data: { categoryId: category.id, assetId: asset.id, type: "EXECUTED", sortOrder: index },
      });
      if (index === 0 && !category.heroImageId) {
        await prisma.category.update({
          where: { id: category.id },
          data: { heroImageId: asset.id },
        });
      }
      added++;
    }
  }
  return added;
}

async function seedIndustries() {
  for (const [index, i] of industries.entries()) {
    const slug = slugify(i.name);
    const data = { name: i.name, icon: i.icon, sortOrder: index + 1, isActive: true };
    await prisma.industry.upsert({
      where: { slug },
      create: { slug, ...data },
      update: overwrite(data),
    });
  }
  return industries.length;
}

async function seedFaqs() {
  // Global FAQs use stable ids so re-running never duplicates them.
  for (const [index, f] of faqs.entries()) {
    const id = `faq-global-${index + 1}`;
    const data = {
      question: f.question,
      answer: f.answer,
      categoryId: null,
      showOnHome: true,
      sortOrder: index + 1,
      isActive: true,
    };
    await prisma.faq.upsert({ where: { id }, create: { id, ...data }, update: overwrite(data) });
  }
  return faqs.length;
}

async function seedSettings() {
  const settings = {
    "contact.phone": site.contact.phone,
    "contact.whatsapp": site.contact.whatsapp,
    "contact.email": site.contact.email,
    "contact.address": site.contact.address,
    "contact.mapEmbedUrl": site.contact.mapEmbedUrl,
    social: site.social,
    "company.establishedYear": site.establishedYear,
  };
  for (const [key, value] of Object.entries(settings)) {
    // Settings are never overwritten — they belong to the admin once created.
    await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value: value ?? Prisma.JsonNull },
      update: {},
    });
  }
  return Object.keys(settings).length;
}

async function main() {
  const result = {
    mode: OVERWRITE ? "overwrite" : "create-missing",
    categories: await seedCategories(),
    imagesAdded: await seedGallery(),
    industries: await seedIndustries(),
    faqs: await seedFaqs(),
    settings: await seedSettings(),
  };
  console.log("Seed complete:", result);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
