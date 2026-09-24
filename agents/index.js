import { createClient } from "@supabase/supabase-js";
import { discover } from "./discover.js";
import { scrape } from "./scrape.js";
import { extract } from "./extract.js";
import { sync } from "./sync.js";

const PAGES_PER_DOMAIN = 3;

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getSite(countryCode) {
  const { data, error } = await admin().from("sites").select("id").eq("country_code", countryCode).single();
  if (error) throw new Error(`No site row for ${countryCode}: ${error.message}`);
  return data.id;
}

async function getTargets(siteId) {
  const { data, error } = await admin()
    .from("scrape_targets")
    .select("domain, store_page_pattern")
    .eq("site_id", siteId)
    .eq("is_active", true);
  if (error) throw new Error(`Could not read scrape_targets -- has migration 0003 run? ${error.message}`);
  return data.map((t) => ({ domain: t.domain, storePagePattern: new RegExp(t.store_page_pattern) }));
}

async function run() {
  const siteId = await getSite("FR");
  const targets = await getTargets(siteId);
  console.log(`Running auto-add scraper for site ${siteId} against ${targets.length} target(s)`);

  for (const { domain, storePagePattern } of targets) {
    console.log(`\n[discover] ${domain}`);
    const urls = await discover(domain, storePagePattern, PAGES_PER_DOMAIN);
    console.log(`  found ${urls.length} candidate page(s)`);

    for (const url of urls) {
      try {
        console.log(`[scrape] ${url}`);
        const { markdown } = await scrape(url);

        console.log(`[extract]`);
        const extracted = await extract(markdown);

        console.log(`[sync] store=${extracted.storeName ?? "(none)"} coupons=${extracted.coupons.length}`);
        const result = await sync(siteId, url, extracted);
        console.log(`  ->`, result);
      } catch (err) {
        console.error(`  failed on ${url}:`, err.message);
      }
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
