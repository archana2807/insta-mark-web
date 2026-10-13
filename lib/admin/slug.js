// URL slug helpers.

export function slugify(input) {
  return String(input ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

/** Returns `base`, or `base-2`, `base-3`… — whichever is free. */
export async function uniqueSlug(base, exists) {
  const root = slugify(base) || "item";
  let candidate = root;
  for (let n = 2; await exists(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}
