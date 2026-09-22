const FIRECRAWL_URL = "https://api.firecrawl.dev/v1";

/**
 * Stage 1: find candidate single-store pages on a competitor domain via
 * Firecrawl's map API, then keep only URLs matching that domain's known
 * per-store page pattern (config-driven per domain -- avoids picking up
 * index/FAQ/category pages that look keyword-relevant but aren't a store).
 */
export async function discover(domain, storePagePattern, limit) {
  const res = await fetch(`${FIRECRAWL_URL}/map`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: `https://${domain}`, limit: 100 }),
  });

  if (!res.ok) {
    throw new Error(`discover(${domain}): Firecrawl map failed with ${res.status}`);
  }

  const data = await res.json();
  const links = Array.isArray(data.links) ? data.links : [];
  const candidates = links.filter((url) => storePagePattern.test(url));

  return candidates.slice(0, limit);
}
