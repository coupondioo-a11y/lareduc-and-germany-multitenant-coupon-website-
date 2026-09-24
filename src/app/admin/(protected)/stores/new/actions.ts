"use server";

import { redirect } from "next/navigation";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { discoverSourceUrl, extractAndHumanize, nameFromDomain, scrapeUrl } from "@/lib/store-import";
import { regenerateStoreContent } from "@/lib/ai-content";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hostOf(input: string): string {
  return input.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
}

/**
 * Add a store by its own domain, e.g. https://miin-cosmetics.com/.
 * Finds a competitor coupon page for it (explicit source URL, or a Firecrawl
 * search against configured scrape_targets domains), scrapes it, has DeepSeek
 * rewrite the offers in original wording, and syncs the store + coupons +
 * a first draft of the full page content.
 */
export async function addStoreManually(formData: FormData): Promise<void> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");

  const domainInput = String(formData.get("domain") ?? "").trim();
  if (!domainInput) throw new Error("Domaine requis");

  const domain = hostOf(domainInput);
  const name = String(formData.get("name") ?? "").trim() || nameFromDomain(domain);
  let sourceUrl = String(formData.get("source_url") ?? "").trim() || null;

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  if (!sourceUrl) {
    const { data: targets } = await admin
      .from("scrape_targets")
      .select("domain")
      .eq("site_id", siteId)
      .eq("is_active", true);
    const domains = (targets ?? []).map((t) => t.domain);
    console.log(`Recherche d'une page source sur : ${domains.join(", ") || "(aucune cible configurée)"}`);
    sourceUrl = await discoverSourceUrl(name, domains);
  }

  const slug = slugify(name);
  const { data: existingStore } = await admin
    .from("stores")
    .select("id")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .maybeSingle();

  let storeId = existingStore?.id;
  if (!storeId) {
    const { data: created, error } = await admin
      .from("stores")
      .insert({
        site_id: siteId,
        name,
        slug,
        affiliate_url: `https://${domain}/`,
        is_active: true,
        content_status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    storeId = created.id;
    console.log(`Boutique créée : ${name} (${domain})`);
  } else {
    console.log(`Boutique existante réutilisée : ${name}`);
  }

  if (!sourceUrl) {
    console.log("Aucune page concurrente trouvée -- boutique créée sans code, à compléter manuellement.");
    redirect(`/admin/stores/${storeId}`);
  }

  console.log(`Source trouvée : ${sourceUrl}`);
  const markdown = await scrapeUrl(sourceUrl);
  console.log(`Page scrapée (${markdown.length} caractères)`);

  const coupons = await extractAndHumanize(markdown, name);
  console.log(`${coupons.length} offre(s) extraite(s) et reformulée(s)`);

  let inserted = 0;
  for (const c of coupons) {
    if (!c.title) continue;
    const { data: dup } = await admin
      .from("coupons")
      .select("id")
      .eq("site_id", siteId)
      .eq("store_id", storeId)
      .eq("title", c.title)
      .maybeSingle();
    if (dup) continue;

    const { error } = await admin.from("coupons").insert({
      site_id: siteId,
      store_id: storeId,
      title: c.title,
      code: c.code,
      type: c.code ? "code" : c.type === "free_shipping" ? "free_shipping" : "deal",
      discount_value: c.discountValue,
      is_active: true,
      scraper_source: sourceUrl,
    });
    if (!error) inserted += 1;
  }
  console.log(`${inserted} nouveau(x) code(s) enregistré(s)`);

  const { count } = await admin
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("store_id", storeId)
    .eq("is_active", true);
  await admin.from("stores").update({ coupon_count: count ?? 0 }).eq("id", storeId);

  try {
    const content = await regenerateStoreContent(storeId, name);
    await admin
      .from("stores")
      .update({ content_body: content, content_status: "draft", content_generated_at: new Date().toISOString() })
      .eq("id", storeId);
    console.log("Contenu de la page généré (brouillon, à valider dans Contenu SEO)");
  } catch (err) {
    console.log(`Génération du contenu échouée : ${(err as Error).message}`);
  }

  redirect(`/admin/stores/${storeId}`);
}
