import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Every content table carries site_id — query it through here instead of
 * `.from(table)` directly, so a query can never accidentally skip the
 * site filter and mix two countries' catalogs.
 */
const SITE_SCOPED_TABLES = [
  "stores",
  "coupons",
  "categories",
  "store_categories",
  "store_reviews",
  "coupon_clicks",
  "push_subscriptions",
  "push_notifications_log",
  "newsletter_subscribers",
  "blog_posts",
  "hero_slides",
  "sidebar_banners",
  "site_stats",
  "flagged_coupons",
] as const;

export type SiteScopedTable = (typeof SITE_SCOPED_TABLES)[number];

export function siteScoped(
  supabase: SupabaseClient,
  table: SiteScopedTable,
  siteId: string,
  columns = "*"
) {
  return supabase.from(table).select(columns).eq("site_id", siteId);
}
