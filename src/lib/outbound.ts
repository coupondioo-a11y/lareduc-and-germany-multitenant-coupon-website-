/**
 * Outbound-link resolution for the coupon reveal flow.
 * Order: coupon `destinationUrl` -> store `affiliateUrl` -> merchant domain,
 * skipping any candidate that resolves to our own domain or a known
 * affiliate-network redirect host (see store-page-flow.md / seo-schema.md).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Defensive blocklist so a network redirect URL is never mistaken for the
// merchant's real site. TimeOne must never be integrated per project
// constraint, but its domains are listed here anyway in case scraped data
// ever points at one.
const NETWORK_DOMAINS = [
  "awin1.com",
  "awin.com",
  "zenaps.com",
  "tradedoubler.com",
  "kwanko.com",
  "tracking.kwanko.com",
  "effiliation.com",
  "track.effiliation.com",
  "timeone.fr",
  "netaffiliation.com",
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export function isExternalUrl(url: string | undefined | null, siteUrl: string = SITE_URL): boolean {
  if (!url) return false;
  const host = hostOf(url);
  if (!host) return false;
  if (host === hostOf(siteUrl)) return false;
  return !NETWORK_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

export function resolveOutboundUrl(
  coupon: { destinationUrl?: string },
  store: { affiliateUrl: string; domain: string },
): string {
  const candidates = [coupon.destinationUrl, store.affiliateUrl, `https://${store.domain}/`];
  for (const url of candidates) {
    if (isExternalUrl(url)) return url as string;
  }
  return `https://${store.domain}/`;
}
