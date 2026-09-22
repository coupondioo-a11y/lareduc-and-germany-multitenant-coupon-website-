import "server-only";
import { createClient } from "@/lib/supabase/server";
import { brandColorFor } from "@/lib/brand-color";
import type { HeroBanner } from "@/components/BannerCarousel";
import type { SiteStats } from "@/components/StatBand";
import type { Coupon, Review, Store } from "@/lib/types";

function hostFromUrl(url: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  affiliate_url: string | null;
  coupon_count: number;
  click_count: number;
  content_body: Store["content"] | null;
  content_status: string;
}

// Category assignment isn't populated by the scraper yet (store_categories
// stays empty until Phase 5+ curates it) -- fall back to one bucket rather
// than crash or show a blank chip.
const FALLBACK_CATEGORY = { name: "Toutes les boutiques", slug: "toutes-les-boutiques" };

function mapStore(row: StoreRow, rating: { value: number; count: number }): Store {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: FALLBACK_CATEGORY.name,
    categorySlug: FALLBACK_CATEGORY.slug,
    blurb: row.description ?? "",
    couponCount: row.coupon_count,
    clicksThisMonth: row.click_count,
    rating: rating.value,
    ratingCount: rating.count,
    domain: hostFromUrl(row.affiliate_url),
    affiliateUrl: row.affiliate_url ?? "",
    brand: brandColorFor(row.name),
    // FAQ schema only fires when approved, per the skill's content_status gate.
    content: row.content_status === "approved" ? row.content_body ?? undefined : undefined,
  };
}

interface CouponRow {
  id: string;
  public_id: number;
  store_id: string;
  title: string;
  type: Coupon["type"];
  code: string | null;
  discount_value: string | null;
  expiry_date: string | null;
  is_featured: boolean;
  click_count: number;
  created_at: string;
  destination_url: string | null;
  store: { slug: string } | { slug: string }[] | null;
}

function mapCoupon(row: CouponRow): Coupon {
  const store = Array.isArray(row.store) ? row.store[0] : row.store;
  return {
    id: row.id,
    publicId: row.public_id,
    storeSlug: store?.slug ?? "",
    title: row.title,
    type: row.type,
    code: row.code ?? undefined,
    discountValue: row.discount_value ?? undefined,
    verifiedAt: row.created_at,
    expiryDate: row.expiry_date ?? undefined,
    isFeatured: row.is_featured,
    isExclusive: row.is_featured, // no separate "exclusive" flag in the schema
    usedCount: row.click_count,
    destinationUrl: row.destination_url ?? undefined,
  };
}

async function ratingFor(siteId: string, storeId: string): Promise<{ value: number; count: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("rating")
    .eq("site_id", siteId)
    .eq("store_id", storeId)
    .eq("is_approved", true)
    .eq("is_seeded", false);

  const rows = data ?? [];
  if (rows.length === 0) return { value: 0, count: 0 };
  const value = rows.reduce((s, r) => s + r.rating, 0) / rows.length;
  return { value: Math.round(value * 10) / 10, count: rows.length };
}

const COUPON_SELECT =
  "id, public_id, store_id, title, type, code, discount_value, expiry_date, is_featured, click_count, created_at, destination_url, store:stores(slug)";

/** Best-offer ordering per database.md: featured first, then most-clicked, active + not expired only. */
export async function getFeaturedHomeCoupons(siteId: string, limit: number): Promise<Coupon[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("site_id", siteId)
    .eq("is_active", true)
    .or(`expiry_date.is.null,expiry_date.gte.${today}`)
    .order("is_featured", { ascending: false })
    .order("click_count", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapCoupon);
}

export async function getStoreBySlug(siteId: string, slug: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, slug, description, affiliate_url, coupon_count, click_count, content_body, content_status")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;
  const rating = await ratingFor(siteId, data.id);
  return mapStore(data, rating);
}

export async function getCouponsForStore(siteId: string, storeId: string): Promise<Coupon[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("site_id", siteId)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .or(`expiry_date.is.null,expiry_date.gte.${today}`)
    .order("is_featured", { ascending: false })
    .order("click_count", { ascending: false });

  return (data ?? []).map(mapCoupon);
}

export async function getCouponByPublicId(
  siteId: string,
  publicId: number
): Promise<{ coupon: Coupon; store: Store } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("site_id", siteId)
    .eq("public_id", publicId)
    .maybeSingle();

  if (!data) return null;
  const coupon = mapCoupon(data);
  const store = await getStoreBySlug(siteId, coupon.storeSlug);
  if (!store) return null;
  return { coupon, store };
}

export async function getAllStores(siteId: string): Promise<Store[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, slug, description, affiliate_url, coupon_count, click_count, content_body, content_status")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("name");

  // ponytail: one rating query per store -- fine at dozens of stores, batch
  // it with a single grouped query if the catalog grows into the thousands.
  return Promise.all((data ?? []).map(async (row) => mapStore(row, await ratingFor(siteId, row.id))));
}

export async function getReviewsForStore(
  siteId: string,
  storeId: string
): Promise<{ genuine: Review[]; seededCount: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("id, author_name, rating, body, created_at, is_seeded, helpful_count")
    .eq("site_id", siteId)
    .eq("store_id", storeId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const genuine = rows
    .filter((r) => !r.is_seeded)
    .map((r) => ({
      id: r.id,
      author: r.author_name,
      rating: r.rating,
      body: r.body,
      createdAt: r.created_at,
      helpful: r.helpful_count,
    }));

  return { genuine, seededCount: rows.filter((r) => r.is_seeded).length };
}

export async function getSiteCounts(
  siteId: string
): Promise<{ storeCount: number; couponCount: number; categoryCount: number }> {
  const supabase = await createClient();
  const [stores, coupons, categories] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("is_active", true),
    supabase.from("coupons").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("is_active", true),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("site_id", siteId),
  ]);

  return {
    storeCount: stores.count ?? 0,
    couponCount: coupons.count ?? 0,
    categoryCount: categories.count ?? 0,
  };
}

export async function getHeroSlides(siteId: string): Promise<HeroBanner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("hero_slides")
    .select(
      "id, headline, figure, cta_label, cta_href, from_color, to_color, store:stores(id, name, slug, description, affiliate_url, coupon_count, click_count, content_body, content_status)"
    )
    .eq("site_id", siteId)
    .eq("is_active", true)
    .order("position");

  const rows = data ?? [];
  const banners: HeroBanner[] = [];

  for (const row of rows) {
    const storeRow = Array.isArray(row.store) ? row.store[0] : row.store;
    if (!storeRow) continue;
    const rating = await ratingFor(siteId, storeRow.id);
    banners.push({
      id: row.id,
      headline: row.headline,
      figure: row.figure ?? "",
      cta: row.cta_label ?? "Voir l'offre",
      from: row.from_color ?? "#FF8A3D",
      to: row.to_color ?? "#FFC46B",
      store: mapStore(storeRow, rating),
    });
  }

  return banners;
}

export async function getSiteStatsRow(siteId: string): Promise<SiteStats | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_stats")
    .select("codes_used_label, codes_used_note, saved_label, saved_note, verified_label, verified_note")
    .eq("site_id", siteId)
    .maybeSingle();

  if (!data || !data.codes_used_label) return null;

  return {
    codesUsed: data.codes_used_label,
    codesUsedNote: data.codes_used_note ?? "",
    saved: data.saved_label ?? "",
    savedNote: data.saved_note ?? "",
    verified: data.verified_label ?? "",
    verifiedNote: data.verified_note ?? "",
  };
}

export async function getOtherStores(siteId: string, excludeSlug: string, limit: number): Promise<Store[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, slug, description, affiliate_url, coupon_count, click_count, content_body, content_status")
    .eq("site_id", siteId)
    .eq("is_active", true)
    .neq("slug", excludeSlug)
    .order("click_count", { ascending: false })
    .limit(limit);

  return Promise.all((data ?? []).map(async (row) => mapStore(row, await ratingFor(siteId, row.id))));
}
