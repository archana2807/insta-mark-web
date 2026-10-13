// Deletes media assets that nothing references any more (DB row + Cloudinary
// file). Used after removing a gallery image, a project or a client logo.

import { destroyAsset } from "@/lib/cloudinary";

export async function deleteAssetsIfUnused(prisma, assetIds) {
  let deleted = 0;
  for (const id of new Set(assetIds.filter(Boolean))) {
    const usage = await prisma.mediaAsset.findUnique({
      where: { id },
      select: {
        publicId: true,
        _count: {
          select: {
            categoryImages: true,
            projectImages: true,
            categoryHeroes: true,
            projectCovers: true,
            clientLogos: true,
          },
        },
      },
    });
    if (!usage || Object.values(usage._count).some((n) => n > 0)) continue;
    await prisma.mediaAsset.delete({ where: { id } });
    deleted++;
    // Local seed images ("/images/…") live in the repo; only Cloudinary files are destroyed.
    if (usage.publicId.startsWith("insta-mark/")) {
      destroyAsset(usage.publicId).catch((err) =>
        console.error("[media] cloudinary destroy failed", usage.publicId, err),
      );
    }
  }
  return deleted;
}
