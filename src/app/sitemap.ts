import type { MetadataRoute } from "next";
import { getSiteContext } from "@/lib/site-context";
import { getActiveEventSlugs, getAllCouponRefs, getAllStores } from "@/lib/db/queries";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteContext();
  const [stores, coupons, eventSlugs] = await Promise.all([
    getAllStores(site.id),
    getAllCouponRefs(site.id),
    getActiveEventSlugs(site.id),
  ]);

  return [
    { url: `${site.siteUrl}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${site.siteUrl}/mentions-legales/`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${site.siteUrl}/confidentialite/`, changeFrequency: "yearly", priority: 0.2 },
    ...LETTERS.map((l) => ({
      url: `${site.siteUrl}/all-stores/${l}/`,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    ...eventSlugs.map((slug) => ({
      url: `${site.siteUrl}/special/${slug}/`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...stores.map((s) => ({
      url: `${site.siteUrl}/store/${s.slug}/`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...coupons
      .filter((c) => c.storeSlug)
      .map((c) => ({
        url: `${site.siteUrl}/store/${c.storeSlug}/${c.publicId}/`,
        lastModified: c.createdAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
  ];
}
