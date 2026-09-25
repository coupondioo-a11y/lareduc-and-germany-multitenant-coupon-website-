export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Per-site store URL slug: FR 'code-promo-{store}', DE '{store}-gutschein' (sites.store_slug_pattern). */
export function storeSlug(pattern: string, name: string): string {
  return (pattern || "{store}").replace("{store}", slugify(name));
}

/** "https://www.miin-cosmetics.com/fr" -> "miin-cosmetics.com" */
export function hostOf(input: string): string {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
}
