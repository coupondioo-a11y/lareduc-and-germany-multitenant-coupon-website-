import { createClient } from "@supabase/supabase-js";
import { gatherStoreFacts } from "./facts.js";
import { generateStoreContent, generateReviews } from "./generate.js";

function validShape(content) {
  return (
    Array.isArray(content.policies) &&
    content.expertGuide?.sections?.length > 0 &&
    content.checkoutGuide?.steps?.length > 0 &&
    Array.isArray(content.faqs) &&
    content.faqs.length > 0
  );
}

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: site, error: siteError } = await supabase.from("sites").select("id").eq("country_code", "FR").single();
  if (siteError) throw new Error(`No FR site: ${siteError.message}`);

  // Idempotent: only stores that haven't been generated yet, unless re-run with FORCE=1.
  let query = supabase.from("stores").select("id, name").eq("site_id", site.id).eq("is_active", true);
  if (!process.env.FORCE) query = query.eq("content_status", "pending");
  const { data: stores } = await query;

  console.log(`Generating content for ${(stores ?? []).length} store(s)`);

  for (const store of stores ?? []) {
    try {
      console.log(`\n[facts] ${store.name}`);
      const facts = await gatherStoreFacts(supabase, store);

      console.log(`[generate] content`);
      const content = await generateStoreContent(facts);

      if (!validShape(content)) {
        console.error(`  skipped: response failed shape validation`);
        continue;
      }

      await supabase
        .from("stores")
        .update({
          content_body: content,
          content_status: "approved", // solo-operator project: no editorial review queue yet -- ship grounded, sanitized content directly.
          content_generated_at: new Date().toISOString(),
          content_approved_at: new Date().toISOString(),
        })
        .eq("id", store.id);

      // Skip review seeding if the store already has enough reviews.
      const { count: existingReviews } = await supabase
        .from("store_reviews")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id);

      if ((existingReviews ?? 0) < 3) {
        console.log(`[generate] reviews`);
        const reviews = await generateReviews(facts);
        const monthsAgo = (n) => new Date(Date.now() - n * 30 * 24 * 3600 * 1000).toISOString();

        let { error: reviewError } = await supabase.from("store_reviews").insert(
          reviews.map((r, i) => ({
            site_id: site.id,
            store_id: store.id,
            author_name: r.author,
            rating: r.rating,
            body: r.body,
            is_approved: true,
            is_seeded: true,
            helpful_count: Math.floor(Math.random() * 12),
            created_at: monthsAgo(i + 1),
          }))
        );
        if (reviewError) console.error(`  review insert failed: ${reviewError.message}`);
      }

      console.log(`  -> done`);
    } catch (err) {
      console.error(`  failed on ${store.name}:`, err.message);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
