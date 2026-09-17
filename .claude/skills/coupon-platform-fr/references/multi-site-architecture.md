# Multi-site (multi-country) architecture — GREENFIELD

This project is a **multi-tenant coupon platform from day one**. One codebase +
one Supabase database + one admin serve many country websites (France, Germany,
and future UK/Spain…). There is NO retrofit and NO live site to protect — build
tenancy in from the first migration and the first component.

This supersedes any "separate project per country" plan: Germany is a **site**
inside this project, not its own codebase. (The completed `codepromoreduc` site
stays live and separate — this is a fresh, independent multi-country build with
its own design and its own catalogs.)

## Locked decisions

1. **Logical separation** — ONE Supabase database, a `site_id` on every content
   row **from the first migration**. Countries never mix; one admin manages all.
2. **Domain-based tenancy** — each country is its own top-level domain, resolved
   from the `Host` header. NOT a `/fr` `/de` path/language switch.
3. **Every catalog built fresh via automation** — no imports. Each site starts
   empty; affiliate network sync + the auto-add competitor scraper populate it
   (France: Awin FR/Kwanko/Effiliation; Germany: Awin DE/belboon/AdCell/
   Tradedoubler DE).
4. **Store URLs keep the `/store/` prefix**, with a per-site slug pattern inside:
   FR `code-promo-{store}` → `/store/code-promo-nike/`; DE `{store}-gutschein`
   → `/store/nike-gutschein/`. Pattern is editable per site in the admin.
5. **Frontend is designed once and shared** across every site — identical
   structure/layout/components. Only content, language, branding (logo/name/
   colors), sitemap and robots change per site.
6. **i18n from the first commit** — no user-facing string is ever hardcoded in a
   component; everything routes through a per-language dictionary. (This is the
   one rule that is painful to add later and free to do now — do it now.)
7. **TimeOne is banned on every site**, forever.

## Greenfield advantage

Because there is no live data to migrate:
- Every table has `site_id` in its very first `CREATE TABLE` — no risky
  retrofit, no backfill of production rows.
- Per-site unique constraints (`unique(site_id, slug)` etc.) are there from the
  start.
- The i18n dictionary exists before the first page is built, so no 77-file
  string-extraction cleanup later.
- France and Germany are both just seed rows in `sites`; neither is a special
  case.

## The `sites` table

```
sites(
  id uuid pk,
  country_code text unique,        -- 'FR','DE','UK','ES'
  primary_domain text unique,
  extra_domains text[],
  is_active boolean default true,
  brand_name text, logo_url text, theme jsonb,   -- branding + color tokens
  language text, locale text, currency text default 'EUR', timezone text,
  store_slug_pattern text,         -- 'code-promo-{store}' | '{store}-gutschein'
  category_path text, route_overrides jsonb,     -- per-site URL segments
  site_url text, ga_measurement_id text, gsc_verification text,
  robots_extra text, sitemap_config jsonb,
  created_at timestamptz default now()
)
site_secrets( site_id uuid pk fk, vapid_public text, vapid_private text,
  network_credentials jsonb )      -- service-role only; never anon-readable
```

Every content table (`stores, coupons, categories, store_categories,
store_reviews, coupon_clicks, push_subscriptions, push_notifications_log,
newsletter_subscribers, blog_posts, hero_slides, sidebar_banners, site_stats,
flagged_coupons`) has `site_id uuid not null references sites(id)` from creation.
Global tables (not site-scoped): `admin_profiles, allowed_proxies, sites,
site_secrets`.

## Tenant resolution

`middleware.ts` reads `request.headers.host`, resolves the site (cache the tiny
`sites` table), injects `x-site-id` + `x-site-lang`. Every server component,
route handler and Server Action scopes its queries by that site_id. Treat a
missing `site_id` filter as a security bug — it would mix two countries'
catalogs. RLS carries a site dimension as defense-in-depth. Dev: map localhost
to a default site, allow `?__site=DE` override in dev only.

## Language, branding, sitemap/robots

- **Content** is authored/generated per site in `sites.language` (the AI
  pipeline generates in that language). **UI chrome** comes from a per-language
  dictionary keyed by `sites.language`, built from the first commit.
- **Branding**: root layout injects `sites.theme` over the CSS variables and
  renders `sites.logo_url` / `sites.brand_name`. Structure stays identical.
- **sitemap.ts / robots.ts** read the host → resolve site → emit only that
  site's URLs + rules. Per-site canonical, OG locale, GSC verification.

## Admin (one panel, all countries)

- **Site switcher** sets the active site (cookie); every admin query is scoped.
- **"Add country"** form inserts a `sites` row + config (domain, brand, logo,
  theme, language, URL patterns, GA, GSC, robots, sitemap, network creds, a
  fresh VAPID keypair).
- All content work is scoped to the selected site. Adding UK/Spain later = fill
  this form + let automation populate the catalog. No new code.

## Phased plan (greenfield)

- **Phase 0 — Foundations & schema:** scaffold; create `sites` + `site_secrets`
  + all content tables **with `site_id`** and per-site unique constraints; seed
  the FR site row. i18n dictionary scaffold in place before any UI.
- **Phase 1 — Tenant resolution:** middleware host→site, site context on server
  + client, dev overrides.
- **Phase 2 — Auth/security + admin shell + site switcher + "Add country".**
- **Phase 3 — Shared frontend, built once, fully dictionary-driven + theme-
  driven** (ui-ux-pro-max for the design). Store page = full reveal flow
  (see store-page-flow.md), all sections, per-site slug pattern.
- **Phase 4 — Networks + auto-add scraper**, keyed per site (FR networks first).
- **Phase 5 — AI content pipeline** generating in `sites.language`.
- **Phase 6 — Per-domain sitemap/robots + SEO schema + canonical/OG per site.**
- **Phase 7 — PWA/push (per-site VAPID) + analytics (per-site GA + consent).**
- **Phase 8 — Seed & launch France**, catalog built fresh via FR automation.
- **Phase 9 — Add Germany via the Add-country form**: DE branding/language/URL
  pattern + DE networks; automation builds the DE catalog fresh. Proves the
  "add a country = config + content" goal.
- Future: UK/Spain = repeat Phase 9 only.

## Top risks

1. Query-scoping discipline — one missing `site_id` filter mixes/leaks
   catalogs; make site scoping a helper that every query goes through, plus RLS.
2. Per-site secrets (VAPID especially) — separate service-role-only storage,
   fresh per site.
3. i18n coverage — enforce "no inline strings" in review from the first PR, or
   the discipline erodes and you end up with the retrofit you avoided.
