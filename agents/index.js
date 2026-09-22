import { createClient } from "@supabase/supabase-js";
import { discover } from "./discover.js";
import { scrape } from "./scrape.js";
import { extract } from "./extract.js";
import { sync } from "./sync.js";
import { COMPETITOR_DOMAINS, PAGES_PER_DOMAIN } from "./config.js";

async function getSiteId(countryCode) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.from("sites").select("id").eq("country_code", countryCode).single();
  if (error) throw new Error(`No site row for ${countryCode}: ${error.message}`);
  return data.id;
}

async function run() {
  const siteId = await getSiteId("FR");
  console.log(`Running auto-add scraper for site ${siteId}`);

  for (const { domain, storePagePattern } of COMPETITOR_DOMAINS) {
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
