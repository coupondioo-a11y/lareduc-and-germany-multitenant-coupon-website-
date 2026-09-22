import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteContext } from "@/lib/site-context";

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-sans",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContext();
  return {
    metadataBase: new URL(site.siteUrl),
    title: {
      default: `${site.brandName} — codes promo et réductions vérifiés`,
      template: `%s | ${site.brandName}`,
    },
    description:
      "Tous les codes promo et réductions en un coup d'œil, vérifiés régulièrement.",
    openGraph: { locale: site.locale.replace("-", "_"), type: "website", siteName: site.brandName },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteContext();

  return (
    <html lang={site.language} className={sans.variable}>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-card focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-ink"
        >
          Aller au contenu
        </a>
        <SiteHeader brandName={site.brandName} />
        <main id="contenu">{children}</main>
        <SiteFooter brandName={site.brandName} />
      </body>
    </html>
  );
}
