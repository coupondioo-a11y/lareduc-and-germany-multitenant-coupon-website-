// Competitor sites to crawl for stores the affiliate networks don't cover.
// Reference list from french-market.md. Each domain's storePagePattern is
// its own per-store URL shape, found by inspecting a live Firecrawl map --
// add more domains here once their pattern is confirmed the same way.
export const COMPETITOR_DOMAINS = [{ domain: "ma-reduc.com", storePagePattern: /reductions-pour-/ }];

// How many candidate store pages to pull per domain per run.
export const PAGES_PER_DOMAIN = 3;
