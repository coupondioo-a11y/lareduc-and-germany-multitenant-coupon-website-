import type { MetadataRoute } from "next";
import { getSiteContext } from "@/lib/site-context";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSiteContext();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }],
    sitemap: `${site.siteUrl}/sitemap.xml`,
  };
}
