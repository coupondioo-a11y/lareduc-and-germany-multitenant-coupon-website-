import "server-only";
import { revalidateTag } from "next/cache";
import { stripMarkdownDeep } from "@/lib/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { LANGUAGE_NAMES, regenerateStoreContent } from "@/lib/ai-content";
import { hostOf, storeSlug } from "@/lib/slug";

const FIRECRAWL_URL = "https://api.firecrawl.dev/v1";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export interface ImportResult {
  ok: boolean;
  storeId?: string;
  storeSlug?: string;
  steps: string[];
  error?: string;
}

type Admin = ReturnType<typeof createAdminClient>;

const SEARCH_WORD: Record<string, string> = {
  fr: "code promo",
  de: "gutschein",
  es: "cupón descuento",
  en: "discount code",
  it: "codice sconto",
};

// Known competitor coupon sites per country, always tried in addition to the
// admin-configured Auto-Add domains, so a fresh install works with no setup.
const DEFAULT_SOURCES: Record<string, string[]> = {
  FR: ["bravopromo.fr", "ma-reduc.com"],
};

/** "miin-cosmetics.com" -> "Miin Cosmetics" */
export function nameFromDomain(domain: string): string {
  const base = hostOf(domain).replace(/\.[a-z]{2,}(\.[a-z]{2})?$/i, "");
  return base
    .split(/[-.]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

async function firecrawl(path: string, body: unknown) {
  const res = await fetch(`${FIRECRAWL_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`Firecrawl ${path} a répondu ${res.status}`);
  return res.json();
}

interface SearchHit {
  url: string;
  title?: string;
}

function pickHit(hits: SearchHit[], nameToken: string, excludeHost?: string): string | null {
  const usable = hits.filter((h) => {
    if (!h.url) return false;
    if (excludeHost && hostOf(h.url) === excludeHost) return false;
    return !/\/(brand|marques?|categor|categories)[-/]/i.test(h.url);
  });
  const token = nameToken.toLowerCase();
  const best = usable.find((h) => `${h.url} ${h.title ?? ""}`.toLowerCase().includes(token));
  return (best ?? usable[0])?.url ?? null;
}

/** Find a coupon page for this store: each competitor domain first ("miin code promo site:bravopromo.fr"), then an open web search. */
export async function discoverSourceUrl(
  storeName: string,
  domains: string[],
  word: string,
  merchantHost: string
): Promise<string | null> {
  const token = storeName.split(/\s+/)[0];

  for (const domain of domains) {
    try {
      const data = await firecrawl("/search", { query: `${storeName} ${word} site:${domain}`, limit: 5 });
      const hit = pickHit(data.data ?? [], token, merchantHost);
      if (hit) return hit;
    } catch {
      // one failing source must not stop the others
    }
  }

  try {
    const data = await firecrawl("/search", { query: `${storeName} ${word}`, limit: 8 });
    return pickHit(data.data ?? [], token, merchantHost);
  } catch {
    return null;
  }
}

export async function scrapeUrl(url: string): Promise<string> {
  const data = await firecrawl("/scrape", { url, formats: ["markdown"] });
  return data.data?.markdown ?? "";
}

export interface ExtractedCoupon {
  title: string;
  code: string | null;
  type: "code" | "deal" | "free_shipping";
  discountValue: string | null;
}

function extractSystem(language: string): string {
  const langName = LANGUAGE_NAMES[language] ?? language;
  return `Tu extrais les offres et codes promo d'une page concurrente pour une boutique donnée, puis tu les RÉÉCRIS dans un style original, en ${langName}.
Règles :
- Ne copie JAMAIS les phrases source mot pour mot : reformule chaque titre d'offre avec tes propres mots, naturellement, comme un humain qui présente un bon plan (le contenu dupliqué est pénalisé en SEO).
- Ne garde un code promo que s'il apparaît littéralement dans le texte source ; sinon "code": null et "type": "deal".
- N'invente aucune réduction absente du texte source. Ignore les offres d'autres marques (bandeaux, suggestions).
- Texte brut uniquement, jamais de markdown.
Réponds UNIQUEMENT avec un JSON valide :
{ "coupons": [{ "title": "string (reformulé)", "code": "string ou null", "type": "code|deal|free_shipping", "discountValue": "string ou null" }] }`;
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function extractAndHumanize(
  markdown: string,
  storeName: string,
  language: string
): Promise<ExtractedCoupon[]> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: extractSystem(language) },
        { role: "user", content: `Boutique : ${storeName}\n\n${markdown.slice(0, 12000)}` },
      ],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`DeepSeek a répondu ${res.status}`);

  const data = await res.json();
  const parsed = stripMarkdownDeep(JSON.parse(stripFences(data.choices?.[0]?.message?.content ?? "{}")));
  const list: ExtractedCoupon[] = Array.isArray(parsed.coupons) ? parsed.coupons : [];

  return list
    .filter((c) => typeof c.title === "string" && c.title.trim())
    .map((c) => {
      // A code the model can't point to in the source text is a hallucination -- drop it.
      const code = c.code && markdown.includes(c.code) ? c.code.trim() : null;
      return {
        title: c.title.trim().slice(0, 200),
        code,
        type: code ? "code" : c.type === "free_shipping" ? "free_shipping" : "deal",
        discountValue: c.discountValue ? String(c.discountValue).trim().slice(0, 40) : null,
      } as ExtractedCoupon;
    });
}

/**
 * Re-running the humanizer rewords every title, so titles can't identify a
 * coupon across runs. Fingerprint by code, else by type+discount (+ occurrence
 * index when several deals share one) so a refresh updates rows in place --
 * keeping their id, public_id URL and click history -- instead of duplicating.
 */
function fingerprint(
  c: { code: string | null; type: string; discount: string | null },
  seen: Map<string, number>
): string {
  const base = c.code ? `c:${c.code.toUpperCase()}` : `d:${c.type}|${(c.discount ?? "").replace(/[^0-9%€$,.]/g, "")}`;
  const n = seen.get(base) ?? 0;
  seen.set(base, n + 1);
  return `${base}#${n}`;
}

async function syncScrapedCoupons(
  admin: Admin,
  siteId: string,
  storeId: string,
  sourceUrl: string,
  coupons: ExtractedCoupon[]
) {
  const { data: existing } = await admin
    .from("coupons")
    .select("id, code, type, discount_value")
    .eq("store_id", storeId)
    .eq("scraper_source", sourceUrl)
    .order("created_at");

  const seenOld = new Map<string, number>();
  const byFp = new Map(
    (existing ?? []).map((r) => [fingerprint({ code: r.code, type: r.type, discount: r.discount_value }, seenOld), r.id])
  );

  const seenNew = new Map<string, number>();
  const matched = new Set<string>();
  let inserted = 0;
  let updated = 0;

  for (const c of coupons) {
    const fp = fingerprint({ code: c.code, type: c.type, discount: c.discountValue }, seenNew);
    const existingId = byFp.get(fp);

    if (existingId) {
      matched.add(existingId);
      await admin
        .from("coupons")
        .update({ title: c.title, code: c.code, type: c.type, discount_value: c.discountValue, is_active: true })
        .eq("id", existingId);
      updated += 1;
    } else {
      const { error } = await admin.from("coupons").insert({
        site_id: siteId,
        store_id: storeId,
        title: c.title,
        code: c.code,
        type: c.type,
        discount_value: c.discountValue,
        is_active: true,
        scraper_source: sourceUrl,
      });
      if (!error) inserted += 1;
    }
  }

  const gone = (existing ?? []).filter((r) => !matched.has(r.id)).map((r) => r.id);
  if (gone.length > 0) await admin.from("coupons").update({ is_active: false }).in("id", gone);

  const { count } = await admin
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("is_active", true);
  await admin.from("stores").update({ coupon_count: count ?? 0, last_updated: new Date().toISOString() }).eq("id", storeId);

  return { inserted, updated, deactivated: gone.length };
}

async function loadSite(admin: Admin, siteId: string) {
  const { data } = await admin
    .from("sites")
    .select("country_code, language, store_slug_pattern")
    .eq("id", siteId)
    .single();
  if (!data) throw new Error("Site introuvable");
  return data;
}

async function competitorDomains(admin: Admin, siteId: string, country: string): Promise<string[]> {
  const { data } = await admin.from("scrape_targets").select("domain").eq("site_id", siteId).eq("is_active", true);
  const configured = (data ?? []).map((t) => hostOf(t.domain)).filter(Boolean);
  return [...new Set([...configured, ...(DEFAULT_SOURCES[country] ?? [])])];
}

/** Generate the full SEO page content from the offers + the brand's own site, and publish it. */
async function generateAndSaveContent(
  admin: Admin,
  store: { id: string; name: string; affiliate_url: string | null },
  language: string,
  steps: string[]
) {
  let brandContext: string | undefined;
  if (store.affiliate_url) {
    try {
      const md = await scrapeUrl(store.affiliate_url);
      brandContext = md.replace(/!\[[^\]]*\]\([^)]*\)/g, "").slice(0, 3500);
      steps.push(`Site officiel scrapé (${md.length} caractères)`);
    } catch (err) {
      steps.push(`Site officiel non lu : ${(err as Error).message}`);
    }
  }

  const content = await regenerateStoreContent(store.id, store.name, { language, brandContext });
  await admin
    .from("stores")
    .update({
      content_body: content,
      description: content.description,
      content_status: "approved",
      content_generated_at: new Date().toISOString(),
      content_approved_at: new Date().toISOString(),
    })
    .eq("id", store.id);
  steps.push("Contenu SEO généré et publié");
}

async function scrapeAndSyncOffers(
  admin: Admin,
  siteId: string,
  store: { id: string; name: string },
  sourceUrl: string,
  language: string,
  steps: string[]
) {
  const markdown = await scrapeUrl(sourceUrl);
  steps.push(`Page concurrente scrapée (${markdown.length} caractères)`);
  if (markdown.length < 200) throw new Error("La page source est vide ou inaccessible");

  const coupons = await extractAndHumanize(markdown, store.name, language);
  steps.push(`${coupons.length} offre(s) extraite(s) et reformulée(s)`);

  const r = await syncScrapedCoupons(admin, siteId, store.id, sourceUrl, coupons);
  steps.push(`${r.inserted} nouvelle(s), ${r.updated} mise(s) à jour, ${r.deactivated} désactivée(s)`);
}

/** The full pipeline: store domain -> competitor page -> offers (humanized) -> store + coupons -> SEO content. */
export async function importStore(
  siteId: string,
  input: { domain: string; name?: string; sourceUrl?: string }
): Promise<ImportResult> {
  const steps: string[] = [];
  try {
    const admin = createAdminClient();
    const site = await loadSite(admin, siteId);
    const language = site.language;

    const host = hostOf(input.domain);
    if (!host || !host.includes(".")) throw new Error("Domaine invalide");
    const name = input.name?.trim() || nameFromDomain(host);
    const slug = storeSlug(site.store_slug_pattern, name);

    let sourceUrl = input.sourceUrl?.trim() || null;
    if (!sourceUrl) {
      const domains = await competitorDomains(admin, siteId, site.country_code);
      steps.push(`Recherche d'une page de codes pour « ${name} » sur : ${domains.join(", ") || "recherche web"}`);
      sourceUrl = await discoverSourceUrl(name, domains, SEARCH_WORD[language] ?? "code promo", host);
    }

    const { data: existing } = await admin
      .from("stores")
      .select("id")
      .eq("site_id", siteId)
      .eq("slug", slug)
      .maybeSingle();

    let storeId = existing?.id as string | undefined;
    if (!storeId) {
      const { data: created, error } = await admin
        .from("stores")
        .insert({
          site_id: siteId,
          name,
          slug,
          affiliate_url: `https://${host}/`,
          is_active: true,
          content_status: "pending",
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      storeId = created.id;
      steps.push(`Boutique créée : ${name} (/${slug}/)`);
    } else {
      steps.push(`Boutique existante : ${name} (/${slug}/)`);
    }

    const store = { id: storeId!, name, affiliate_url: `https://${host}/` };

    if (sourceUrl) {
      steps.push(`Source : ${sourceUrl}`);
      await scrapeAndSyncOffers(admin, siteId, store, sourceUrl, language, steps);
    } else {
      steps.push("Aucune page de codes trouvée : ajoutez un site concurrent ou collez l'URL source.");
    }

    try {
      await generateAndSaveContent(admin, store, language, steps);
    } catch (err) {
      steps.push(`Contenu SEO non généré : ${(err as Error).message}`);
    }

    revalidateTag("homepage");
    return { ok: true, storeId, storeSlug: slug, steps };
  } catch (err) {
    return { ok: false, steps, error: (err as Error).message };
  }
}

/** "Update coupons" for one store: re-scrape its known (or newly discovered) source and sync in place. */
export async function refreshStoreOffers(storeId: string): Promise<ImportResult> {
  const steps: string[] = [];
  try {
    const admin = createAdminClient();
    const { data: store } = await admin
      .from("stores")
      .select("id, name, site_id, affiliate_url, slug")
      .eq("id", storeId)
      .single();
    if (!store) throw new Error("Boutique introuvable");

    const site = await loadSite(admin, store.site_id);

    const { data: last } = await admin
      .from("coupons")
      .select("scraper_source")
      .eq("store_id", storeId)
      .not("scraper_source", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let sourceUrl = last?.scraper_source ?? null;
    if (!sourceUrl) {
      const domains = await competitorDomains(admin, store.site_id, site.country_code);
      steps.push(`Recherche d'une source sur : ${domains.join(", ") || "recherche web"}`);
      sourceUrl = await discoverSourceUrl(
        store.name,
        domains,
        SEARCH_WORD[site.language] ?? "code promo",
        hostOf(store.affiliate_url ?? "")
      );
    }
    if (!sourceUrl) throw new Error("Aucune page source trouvée pour cette boutique");

    steps.push(`Source : ${sourceUrl}`);
    await scrapeAndSyncOffers(admin, store.site_id, store, sourceUrl, site.language, steps);
    revalidateTag("homepage");
    return { ok: true, storeId, storeSlug: store.slug, steps };
  } catch (err) {
    return { ok: false, steps, error: (err as Error).message };
  }
}

/** "Generate content" for one store. */
export async function regenerateStoreSeo(storeId: string): Promise<ImportResult> {
  const steps: string[] = [];
  try {
    const admin = createAdminClient();
    const { data: store } = await admin
      .from("stores")
      .select("id, name, site_id, affiliate_url, slug")
      .eq("id", storeId)
      .single();
    if (!store) throw new Error("Boutique introuvable");

    const site = await loadSite(admin, store.site_id);
    await generateAndSaveContent(admin, store, site.language, steps);
    revalidateTag("homepage");
    return { ok: true, storeId, storeSlug: store.slug, steps };
  } catch (err) {
    return { ok: false, steps, error: (err as Error).message };
  }
}
