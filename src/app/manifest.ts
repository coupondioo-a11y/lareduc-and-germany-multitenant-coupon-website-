import type { MetadataRoute } from "next";
import { getSiteContext } from "@/lib/site-context";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSiteContext();
  const theme = (site.theme as { primary?: string }) ?? {};

  return {
    name: site.brandName,
    short_name: site.brandName,
    description: `Codes promo et réductions vérifiés sur ${site.brandName}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: theme.primary ?? "#111111",
    lang: site.language,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
