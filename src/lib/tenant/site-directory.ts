import "server-only";

/**
 * Site directory — the `sites` table is tiny (a handful of rows), so we
 * fetch it once and cache in memory rather than querying per request.
 * Works from middleware (edge runtime) since it's a plain fetch, no
 * supabase-js client needed.
 */
export interface SiteRow {
  id: string;
  countryCode: string;
  primaryDomain: string;
  extraDomains: string[];
  language: string;
  locale: string;
  brandName: string;
  logoUrl: string | null;
  theme: Record<string, unknown>;
  currency: string;
  timezone: string;
  storeSlugPattern: string;
  categoryPath: string;
  siteUrl: string;
  isActive: boolean;
  gaMeasurementId: string | null;
  gscVerification: string | null;
  operatorName: string | null;
  operatorAddress: string | null;
  siret: string | null;
  publicationDirector: string | null;
  hostName: string | null;
  hostAddress: string | null;
  dpoEmail: string | null;
}

interface RawSiteRow {
  id: string;
  country_code: string;
  primary_domain: string;
  extra_domains: string[] | null;
  language: string;
  locale: string;
  brand_name: string;
  logo_url: string | null;
  theme: Record<string, unknown> | null;
  currency: string;
  timezone: string;
  store_slug_pattern: string;
  category_path: string;
  site_url: string;
  is_active: boolean;
  ga_measurement_id: string | null;
  gsc_verification: string | null;
  operator_name: string | null;
  operator_address: string | null;
  siret: string | null;
  publication_director: string | null;
  host_name: string | null;
  host_address: string | null;
  dpo_email: string | null;
}

const TTL_MS = 60_000;
let cache: { sites: SiteRow[]; fetchedAt: number } | null = null;

function normalize(r: RawSiteRow): SiteRow {
  return {
    id: r.id,
    countryCode: r.country_code,
    primaryDomain: r.primary_domain,
    extraDomains: r.extra_domains ?? [],
    language: r.language,
    locale: r.locale,
    brandName: r.brand_name,
    logoUrl: r.logo_url,
    theme: r.theme ?? {},
    currency: r.currency,
    timezone: r.timezone,
    storeSlugPattern: r.store_slug_pattern,
    categoryPath: r.category_path,
    siteUrl: r.site_url,
    isActive: r.is_active,
    gaMeasurementId: r.ga_measurement_id,
    gscVerification: r.gsc_verification,
    operatorName: r.operator_name,
    operatorAddress: r.operator_address,
    siret: r.siret,
    publicationDirector: r.publication_director,
    hostName: r.host_name,
    hostAddress: r.host_address,
    dpoEmail: r.dpo_email,
  };
}

async function fetchSites(): Promise<SiteRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  // select('*') deliberately -- this is the shared tenant-resolution path every
  // page depends on, so it must survive a deploy that lands before its own
  // migration runs. A hardcoded column list here would 400 the whole site the
  // moment a new column is referenced but not yet migrated.
  const res = await fetch(`${url}/rest/v1/sites?is_active=eq.true&select=*`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];

  const rows = (await res.json()) as RawSiteRow[];
  return rows.map(normalize);
}

async function getSites(): Promise<SiteRow[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache.sites;
  const sites = await fetchSites();
  cache = { sites, fetchedAt: now };
  return sites;
}

/**
 * Resolve a site from the request Host header.
 * `devOverrideCountry` (dev only, wired from middleware) lets you preview
 * any country on localhost via ?__site=DE or DEV_SITE_COUNTRY.
 */
export async function getSiteByHost(
  host: string,
  devOverrideCountry?: string | null
): Promise<SiteRow | null> {
  const sites = await getSites();
  if (sites.length === 0) return null;

  if (devOverrideCountry) {
    const byCountry = sites.find((s) => s.countryCode === devOverrideCountry.toUpperCase());
    if (byCountry) return byCountry;
  }

  const byHost = sites.find((s) => s.primaryDomain === host || s.extraDomains.includes(host));
  if (byHost) return byHost;

  // Plain localhost with no override: fall back to the first active site
  // rather than 404ing during local dev.
  if (host === "localhost" || host.startsWith("127.0.0.1")) {
    return sites[0] ?? null;
  }

  return null;
}

export async function getSiteById(id: string): Promise<SiteRow | null> {
  const sites = await getSites();
  return sites.find((s) => s.id === id) ?? null;
}
