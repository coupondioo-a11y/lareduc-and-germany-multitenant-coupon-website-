# Database

Supabase/Postgres. 16 tables (row counts are from a live site at ~2,000 stores,
useful as a scale reference).

| Table | Rows | Purpose |
|---|---|---|
| `stores` | 2,135 | Merchants + AI content |
| `coupons` | 14,454 | Offers and codes |
| `categories` | 56 | Taxonomy |
| `store_categories` | 5,587 | Join |
| `store_reviews` | 40 | Customer reviews |
| `coupon_clicks` | — | Click analytics |
| `push_subscriptions` | — | Web-push endpoints |
| `push_notifications_log` | — | Send history |
| `newsletter_subscribers` | — | Email list |
| `admin_profiles` | 4 | Admin users + permissions |
| `hero_slides` | 5 | Homepage carousel |
| `sidebar_banners` | 5 | Store-page sidebar |
| `site_stats` | 4 | Homepage stat bar |
| `blog_posts` | — | Blog |
| `flagged_coupons` | — | User reports |
| `allowed_proxies` | 4 | IP allowlist |

> A `store_contributors` table existed for a manually-curated leaderboard. It
> was never populated and the whole subsystem was deleted. **Do not recreate
> it** — derive the leaderboard from `click_count` instead.

---

## Core tables

### `stores`
```
id, wp_term_id, name, slug, description, logo_url, affiliate_url,
meta_title, meta_description, coupon_count, is_featured, is_active,
click_count, created_at, last_updated, awin_merchant_id, popup_banner_url,
network_merchant_ids (jsonb), is_indexed, content_status, content_body (jsonb),
content_generated_at, content_approved_at, content_approved_by, content_tier,
show_on_daily, show_on_weekly, logo_source, logo_imported_at
```

`content_body` shape:
```ts
{
  description, h2_sections[], faqs[], internal_link_mentions[],
  extras: {
    policies[],                                   // 6 entries
    expert_guide: { intro, sections[] },          // 3 H2 sections
    checkout_guide: { intro, steps[] },           // 4–5 steps
    pro_tips[],                                   // 3
    intelligence_briefing: { intro, savings_analysis[], policies_summary[], insider },
    generated_at, model
  }
}
```

`content_status`: `pending` → `draft` → `approved`. FAQ schema is only emitted
when `approved`.

`content_tier`: `premium` | `standard` | `light` — controls generated word
counts and how many H2s/FAQs to produce.

### `coupons`
```
id, wp_post_id, public_id, store_id, title, slug, code, type,
discount_value, destination_url, expiry_date, is_free_shipping,
is_active, is_flagged, click_count, created_at, awin_promo_id,
scraper_source, is_featured, network, network_coupon_id,
network_merchant_id, is_daily_deal, is_weekly_deal
```

`type`: `code` | `deal` | `free_shipping`. A coupon "has a code" only when
`code` is non-empty — that drives `DiscountCode` vs `Offer` schema and the
reveal-button behaviour.

Ordering convention for "best offer": `is_featured desc nullsFirst:false`,
then `click_count desc`, filtered to `is_active = true` and
`expiry_date is null or expiry_date >= today`.

### `store_reviews`
```
id, store_id, author_name, rating (1-5), body, is_approved, created_at,
avatar_url, helpful_count, not_helpful_count, is_seeded
```

`is_seeded = true` marks AI-generated placeholders. **Rating schema must
exclude them** — see `seo-schema.md`.

### `admin_profiles`
```
id (= auth.users.id), email (NOT NULL), permissions (jsonb), created_at, is_active
```
The NOT NULL `email` is why you must `UPDATE` rather than `upsert` when
changing only permissions (SKILL.md §3).

### `push_subscriptions`
```
id, endpoint, p256dh, auth, store_preferences (uuid[]),
created_at, updated_at, source_store_slug, user_agent
```
`source_store_slug` records which store page the visitor subscribed from —
that's what makes "send only to people who came from Nike" possible.
`store_preferences` holds stores they explicitly followed.

A valid `p256dh` decodes to 65 bytes (~87 base64 chars). Anything shorter is
corrupt and will fail every send — treat malformed keys as invalid and delete
them alongside 410/404 expiries.

---

## Migration conventions

Every file must be safe to run twice:

```sql
create table if not exists store_reviews (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 2 and 40),
  rating      int  not null check (rating between 1 and 5),
  body        text not null check (char_length(body) between 10 and 1200),
  is_approved boolean not null default false,
  created_at  timestamptz not null default now()
);

-- columns added after first release
alter table store_reviews add column if not exists avatar_url text;
alter table store_reviews add column if not exists is_seeded boolean not null default false;

create index if not exists idx_store_reviews_store
  on store_reviews (store_id, is_approved, created_at desc);

alter table store_reviews enable row level security;

drop policy if exists "public read approved reviews" on store_reviews;
create policy "public read approved reviews"
  on store_reviews for select using (is_approved = true);
```

Paste the file **contents** into the SQL editor, not the filename.

## RLS pattern

Public tables: anon `SELECT` gated on a visibility flag, no anon writes.

```sql
alter table <t> enable row level security;
create policy "public read <t>" on <t> for select using (<flag> = true);
```

All writes go through the service-role client in server-only code. This is
deliberate: it means a leaked anon key cannot mutate anything.

## Indexes that matter at scale

```sql
create index on coupons (store_id, is_active, expiry_date);
create index on coupons (is_featured desc, click_count desc);
create index on stores (slug);
create index on stores (is_active, coupon_count desc);
create index on store_categories (category_id, store_id);
create index on store_reviews (store_id, is_approved, created_at desc);
```

## Query gotchas

**Embedded joins return arrays.** `store:stores(name,slug)` gives `[]`, not
`{}`, and TypeScript will tell you so:
```ts
const normalized = rows.map(r => ({
  ...r, store: Array.isArray(r.store) ? r.store[0] ?? null : r.store,
}))
```

**An invalid column in `.order()` empties the whole result** with no error
surfaced to the UI. Verify column names first.

**`.or()` with `in` lists** needs the raw comma syntax:
```ts
.or(`id.in.(${ids.join(',')}),slug.in.(${slugs.join(',')})`)
```

**Pagination for full-table reads** — Supabase caps rows per request; loop with
`.range(from, from + 999)` until a short page comes back.

---

## Importing from WordPress

The schema keeps `wp_term_id` on `stores` and `wp_post_id` on `coupons`
specifically so a WordPress import can be re-run idempotently and reconciled.

Order of operations:
1. Export merchants (terms), coupons (posts), categories, term relationships
2. Insert `stores` with `wp_term_id` preserved
3. Insert `coupons` with `wp_post_id` preserved, resolving `store_id` via
   `wp_term_id`
4. Rebuild `store_categories` from term relationships
5. Download logos → Supabase Storage, **resizing to ≤760px WebP during import**
   (doing it later means re-processing every file — see `performance.md`)
6. Recompute `coupon_count` per store from actual active rows rather than
   trusting the exported value
7. Verify counts against the source before switching DNS
