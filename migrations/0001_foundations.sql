-- ============================================================================
-- 0001_foundations.sql
-- Phase 0: multi-tenant schema foundations.
-- Idempotent — safe to re-run. Paste file CONTENTS into the Supabase SQL editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- GLOBAL TABLES (not site-scoped)
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists sites (
  id                    uuid primary key default gen_random_uuid(),
  country_code          text not null unique,               -- 'FR', 'DE', 'UK', 'ES'
  primary_domain        text not null unique,
  extra_domains         text[] not null default '{}',
  is_active             boolean not null default true,
  brand_name            text not null,
  logo_url              text,
  theme                 jsonb not null default '{}',         -- color tokens etc.
  language              text not null,                       -- 'fr', 'de'
  locale                text not null,                       -- 'fr-FR', 'de-DE'
  currency              text not null default 'EUR',
  timezone              text not null default 'Europe/Paris',
  store_slug_pattern    text not null,                        -- 'code-promo-{store}' | '{store}-gutschein'
  category_path         text not null default 'coupon-category',
  route_overrides       jsonb not null default '{}',          -- per-site URL segment overrides
  site_url              text not null,                        -- https://example.fr
  ga_measurement_id     text,
  gsc_verification      text,
  robots_extra          text,
  sitemap_config        jsonb not null default '{}',
  created_at            timestamptz not null default now()
);

create index if not exists idx_sites_active on sites (is_active);

create table if not exists site_secrets (
  site_id               uuid primary key references sites(id) on delete cascade,
  vapid_public          text,
  vapid_private         text,
  network_credentials   jsonb not null default '{}',          -- { awin: {...}, kwanko: {...} }
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- site_secrets is service-role only: no RLS policy grants anon/authenticated access.
alter table site_secrets enable row level security;

create table if not exists admin_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  permissions   jsonb not null default '[]',   -- e.g. ["stores","coupons",...]
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table admin_profiles enable row level security;

create table if not exists allowed_proxies (
  id          uuid primary key default gen_random_uuid(),
  ip          text not null unique,
  label       text,
  created_at  timestamptz not null default now()
);

alter table allowed_proxies enable row level security;

-- ----------------------------------------------------------------------------
-- SITE-SCOPED CONTENT TABLES — every one carries site_id from creation
-- ----------------------------------------------------------------------------

create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references sites(id) on delete cascade,
  name          text not null,
  slug          text not null,
  icon_name     text,
  position      int not null default 0,
  created_at    timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists stores (
  id                    uuid primary key default gen_random_uuid(),
  site_id               uuid not null references sites(id) on delete cascade,
  name                  text not null,
  slug                  text not null,
  description           text,
  logo_url              text,
  logo_source           text,
  logo_imported_at      timestamptz,
  affiliate_url         text,
  meta_title            text,
  meta_description      text,
  coupon_count          int not null default 0,
  is_featured           boolean not null default false,
  is_active             boolean not null default true,
  is_indexed            boolean not null default true,
  click_count           int not null default 0,
  popup_banner_url      text,
  awin_merchant_id      text,
  network_merchant_ids  jsonb not null default '{}',   -- { awin: '123', kwanko: '456' }
  content_status        text not null default 'pending' check (content_status in ('pending','draft','approved')),
  content_body          jsonb,
  content_tier          text not null default 'standard' check (content_tier in ('premium','standard','light')),
  content_generated_at  timestamptz,
  content_approved_at   timestamptz,
  content_approved_by   uuid references admin_profiles(id),
  show_on_daily         boolean not null default false,
  show_on_weekly        boolean not null default false,
  created_at            timestamptz not null default now(),
  last_updated          timestamptz not null default now(),
  unique (site_id, slug)
);

create index if not exists idx_stores_active_count on stores (site_id, is_active, coupon_count desc);

create table if not exists store_categories (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references sites(id) on delete cascade,
  store_id      uuid not null references stores(id) on delete cascade,
  category_id   uuid not null references categories(id) on delete cascade,
  unique (site_id, store_id, category_id)
);

create index if not exists idx_store_categories_lookup on store_categories (site_id, category_id, store_id);

-- public_id: stable numeric id for the addressable /store/{slug}/{public_id}/ route.
-- Global sequence is fine — it is an opaque identifier, not scoped per site.
create sequence if not exists coupons_public_id_seq start 480001;

create table if not exists coupons (
  id                    uuid primary key default gen_random_uuid(),
  site_id               uuid not null references sites(id) on delete cascade,
  public_id             bigint not null default nextval('coupons_public_id_seq') unique,
  store_id              uuid not null references stores(id) on delete cascade,
  title                 text not null,
  slug                  text,
  code                  text,
  type                  text not null check (type in ('code','deal','free_shipping')),
  discount_value        text,
  destination_url       text,
  expiry_date           date,
  is_free_shipping      boolean not null default false,
  is_active             boolean not null default true,
  is_flagged            boolean not null default false,
  is_featured           boolean not null default false,
  is_daily_deal         boolean not null default false,
  is_weekly_deal        boolean not null default false,
  click_count           int not null default 0,
  network               text,                      -- 'awin' | 'kwanko' | 'effiliation' | 'scraper'
  network_coupon_id     text,
  network_merchant_id   text,
  awin_promo_id         text,
  scraper_source        text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_coupons_store_active on coupons (site_id, store_id, is_active, expiry_date);
create index if not exists idx_coupons_featured on coupons (site_id, is_featured desc, click_count desc);
create index if not exists idx_coupons_public_id on coupons (public_id);

create table if not exists store_reviews (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references sites(id) on delete cascade,
  store_id          uuid not null references stores(id) on delete cascade,
  author_name       text not null check (char_length(author_name) between 2 and 40),
  rating            int not null check (rating between 1 and 5),
  body              text not null check (char_length(body) between 10 and 1200),
  avatar_url        text,
  is_approved       boolean not null default false,
  is_seeded         boolean not null default false,
  helpful_count     int not null default 0,
  not_helpful_count int not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists idx_store_reviews_store on store_reviews (site_id, store_id, is_approved, created_at desc);

create table if not exists coupon_clicks (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references sites(id) on delete cascade,
  coupon_id     uuid not null references coupons(id) on delete cascade,
  store_id      uuid not null references stores(id) on delete cascade,
  ip_hash       text,
  user_agent    text,
  referrer      text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_coupon_clicks_coupon on coupon_clicks (site_id, coupon_id, created_at desc);

create table if not exists push_subscriptions (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references sites(id) on delete cascade,
  endpoint            text not null,
  p256dh              text not null,
  auth                text not null,
  store_preferences   uuid[] not null default '{}',
  source_store_slug   text,
  user_agent          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (site_id, endpoint)
);

create table if not exists push_notifications_log (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references sites(id) on delete cascade,
  title         text not null,
  body          text not null,
  sent_count    int not null default 0,
  sent_by       uuid references admin_profiles(id),
  created_at    timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references sites(id) on delete cascade,
  email               text not null,
  is_active           boolean not null default true,
  source_store_slug   text,
  subscribed_at       timestamptz not null default now(),
  unique (site_id, email)
);

create table if not exists blog_posts (
  id                uuid primary key default gen_random_uuid(),
  site_id           uuid not null references sites(id) on delete cascade,
  slug              text not null,
  title             text not null,
  excerpt           text,
  body              text,
  cover_image_url   text,
  meta_title        text,
  meta_description  text,
  is_published      boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  unique (site_id, slug)
);

create table if not exists hero_slides (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references sites(id) on delete cascade,
  store_id      uuid references stores(id) on delete set null,
  headline      text not null,
  figure        text,
  cta_label     text,
  cta_href      text,
  from_color    text,
  to_color      text,
  position      int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_hero_slides_site on hero_slides (site_id, is_active, position);

create table if not exists sidebar_banners (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references sites(id) on delete cascade,
  store_id      uuid references stores(id) on delete set null,
  image_url     text,
  href          text,
  alt           text,
  position      int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sidebar_banners_site on sidebar_banners (site_id, is_active, position);

create table if not exists site_stats (
  site_id                   uuid primary key references sites(id) on delete cascade,
  codes_used_label          text,
  codes_used_note           text,
  saved_label               text,
  saved_note                text,
  verified_label            text,
  verified_note             text,
  shops_listed_label        text,
  active_codes_label        text,
  category_count_label      text,
  updated_at                timestamptz not null default now()
);

create table if not exists flagged_coupons (
  id              uuid primary key default gen_random_uuid(),
  site_id         uuid not null references sites(id) on delete cascade,
  coupon_id       uuid not null references coupons(id) on delete cascade,
  reason          text not null,
  reporter_note   text,
  status          text not null default 'pending' check (status in ('pending','resolved','dismissed')),
  resolved_by     uuid references admin_profiles(id),
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_flagged_coupons_status on flagged_coupons (site_id, status, created_at desc);

-- ----------------------------------------------------------------------------
-- RLS — public tables: anon SELECT gated on a visibility flag, no anon writes.
-- All writes go through the service-role client in server-only code.
-- ----------------------------------------------------------------------------

alter table categories enable row level security;
drop policy if exists "public read categories" on categories;
create policy "public read categories" on categories for select using (true);

alter table stores enable row level security;
drop policy if exists "public read active stores" on stores;
create policy "public read active stores" on stores for select using (is_active = true);

alter table store_categories enable row level security;
drop policy if exists "public read store_categories" on store_categories;
create policy "public read store_categories" on store_categories for select using (true);

alter table coupons enable row level security;
drop policy if exists "public read active coupons" on coupons;
create policy "public read active coupons" on coupons for select using (is_active = true and is_flagged = false);

alter table store_reviews enable row level security;
drop policy if exists "public read approved reviews" on store_reviews;
create policy "public read approved reviews" on store_reviews for select using (is_approved = true);

alter table hero_slides enable row level security;
drop policy if exists "public read active hero_slides" on hero_slides;
create policy "public read active hero_slides" on hero_slides for select using (is_active = true);

alter table sidebar_banners enable row level security;
drop policy if exists "public read active sidebar_banners" on sidebar_banners;
create policy "public read active sidebar_banners" on sidebar_banners for select using (is_active = true);

alter table site_stats enable row level security;
drop policy if exists "public read site_stats" on site_stats;
create policy "public read site_stats" on site_stats for select using (true);

alter table blog_posts enable row level security;
drop policy if exists "public read published blog_posts" on blog_posts;
create policy "public read published blog_posts" on blog_posts for select using (is_published = true);

alter table sites enable row level security;
drop policy if exists "public read active sites" on sites;
create policy "public read active sites" on sites for select using (is_active = true);

-- coupon_clicks, push_subscriptions, push_notifications_log, newsletter_subscribers,
-- flagged_coupons: RLS enabled, no public policy — writes and reads go through
-- the service-role client only (public endpoints use createAdminClient()).
alter table coupon_clicks enable row level security;
alter table push_subscriptions enable row level security;
alter table push_notifications_log enable row level security;
alter table newsletter_subscribers enable row level security;
alter table flagged_coupons enable row level security;

-- ----------------------------------------------------------------------------
-- SEED: France site row
-- ----------------------------------------------------------------------------

insert into sites (
  country_code, primary_domain, is_active, brand_name, language, locale,
  currency, timezone, store_slug_pattern, category_path, site_url
)
select 'FR', '__REPLACE_WITH_FR_DOMAIN__', true, '__REPLACE_WITH_FR_BRAND_NAME__',
       'fr', 'fr-FR', 'EUR', 'Europe/Paris', 'code-promo-{store}', 'coupon-category',
       'https://__REPLACE_WITH_FR_DOMAIN__'
where not exists (select 1 from sites where country_code = 'FR');

insert into site_secrets (site_id)
select id from sites where country_code = 'FR'
on conflict (site_id) do nothing;
