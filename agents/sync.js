import { createClient } from "@supabase/supabase-js";

function slugify(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stage 4: upsert the extracted store + its coupons, scoped to one site. */
export async function sync(siteId, sourceUrl, extracted) {
  if (!extracted.storeName) {
    return { skipped: true, reason: "no store identified on page" };
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: siteRow } = await supabase.from("sites").select("store_slug_pattern").eq("id", siteId).single();
  const slug = (siteRow?.store_slug_pattern ?? "{store}").replace("{store}", slugify(extracted.storeName));

  const { data: existing } = await supabase
    .from("stores")
    .select("id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .maybeSingle();

  let storeId = existing?.id;

  if (!storeId) {
    const { data: created, error } = await supabase
      .from("stores")
      .insert({
        site_id: siteId,
        name: extracted.storeName,
        slug,
        affiliate_url: extracted.storeDomain ? `https://${extracted.storeDomain}/` : null,
        is_active: true,
        content_status: "pending",
      })
      .select("id")
      .single();

    if (error) throw new Error(`sync(): store insert failed: ${error.message}`);
    storeId = created.id;
  }

  let insertedCoupons = 0;

  for (const c of extracted.coupons) {
    if (!c.title) continue;

    const { data: dup } = await supabase
      .from("coupons")
      .select("id")
      .eq("site_id", siteId)
      .eq("store_id", storeId)
      .eq("title", c.title)
      .maybeSingle();

    if (dup) continue;

    const { error } = await supabase.from("coupons").insert({
      site_id: siteId,
      store_id: storeId,
      title: c.title,
      code: c.code ?? null,
      type: c.code ? "code" : c.type === "free_shipping" ? "free_shipping" : "deal",
      discount_value: c.discountValue ?? null,
      is_active: true,
      network: null,
      scraper_source: sourceUrl,
    });

    if (!error) insertedCoupons += 1;
  }

  // coupon_count is always recomputed from real rows, never trusted from the source.
  const { count } = await supabase
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("store_id", storeId)
    .eq("is_active", true);

  await supabase.from("stores").update({ coupon_count: count ?? 0, last_updated: new Date().toISOString() }).eq("id", storeId);

  return { skipped: false, storeId, storeSlug: slug, insertedCoupons };
}
