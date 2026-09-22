import type { MetadataRoute } from "next";
import { getSiteContext } from "@/lib/site-context";
import { getAllCouponRefs, getAllStores } from "@/lib/db/queries";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSiteContext();
  const [stores, coupons] = await Promise.all([getAllStores(site.id), getAllCouponRefs(site.id)]);

  return [
    { url: `${site.siteUrl}/`, changeFrequency: "hourly", priority: 1 },
    ...LETTERS.map((l) => ({
      url: `${site.siteUrl}/all-stores/${l}/`,
      changeFrequency: "daily" as const,
      priority: 0.5,
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
