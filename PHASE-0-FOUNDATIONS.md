# Phase 0 — Foundations & schema

Status: schema drafted, no application code written yet. Waiting on go-ahead
+ the credentials listed at the bottom before starting Phase 1.

Context: this repo already has a single-site FR frontend prototype
(`src/app`, `src/components`, `src/lib/fixtures.ts`) built against the
earlier single-site kickoff, with **no Supabase, no admin, no `site_id`
anywhere**. It stays as the visual/structural reference for Phase 3 (shared
frontend) but every data-fetching path in it will be rebuilt against the
schema below instead of the fixtures.

---

## 1. Schema — `migrations/0001_foundations.sql`

Idempotent SQL, ready to paste into the Supabase SQL editor. Covers:

- **Global tables**: `sites`, `site_secrets` (service-role only, no anon
  policy), `admin_profiles`, `allowed_proxies`.
- **Every content table** (`categories, stores, store_categories, coupons,
  store_reviews, coupon_clicks, push_subscriptions, push_notifications_log,
  newsletter_subscribers, blog_posts, hero_slides, sidebar_banners,
  site_stats, flagged_coupons`) with `site_id uuid not null references
  sites(id)` from creation, and per-site unique constraints (`unique(site_id,
  slug)`, `unique(site_id, endpoint)`, etc.) instead of global ones.
- `coupons.public_id` — a global `bigserial`-style sequence (`bigint unique`,
  starting at 480001 to match the existing fixture range). It's an opaque
  addressable id for `/store/{slug}/{public_id}/`, so it doesn't need to be
  site-scoped — only globally unique.
- RLS: public tables get an anon `SELECT` policy gated on their visibility
  flag (`is_active`, `is_approved`, `is_published`); no anon-writable table
  anywhere. Click/subscription/newsletter/flagged tables have RLS enabled
  with **no** public policy — service-role only, matching the "public writes
  go through `createAdminClient()`" rule.
- Seed: one `sites` row for France with placeholder domain/brand values
  (`__REPLACE_WITH_FR_DOMAIN__` / `__REPLACE_WITH_FR_BRAND_NAME__`) — fill
  these in once the domain is confirmed (see credentials list), or I can
  update the migration once you give me the values.

Deliberately **not** included, since this is a from-scratch build: no
`wp_term_id` / `wp_post_id` columns (those exist in the reference schema only
to reconcile a WordPress import — see `database.md` §Importing from
WordPress — and this project has no import step).

---

## 2. Tenant-resolution design — `middleware.ts` (not yet written)

**Flow:**

1. Read `request.headers.get('host')`, strip port.
2. Resolve `host → site` via an in-memory cache of the `sites` table
   (it's a handful of rows — fetch once, cache with a short TTL e.g. 60s,
   refresh on miss rather than re-querying per request). Match against
   `primary_domain` first, then `extra_domains`.
3. **Dev override**: if `NODE_ENV !== 'production'`, allow `?__site=DE`
   (query param) or a `DEV_SITE_COUNTRY` env var to force a site regardless
   of host, so `localhost:3000` can preview any country without editing
   `/etc/hosts`. Falls back to the first active site (FR) if neither is set.
4. No match in production → `404` (unknown domain), not a fallback to FR —
   silently serving the wrong catalog on a misconfigured domain is worse than
   a clear 404.
5. Inject `x-site-id` and `x-site-lang` as request headers (middleware sets
   them on the outgoing request via `NextResponse.next({ request: { headers }
   })`), so every server component / route handler / Server Action reads the
   site id from headers rather than re-resolving the host itself.
6. A small `getSiteContext()` server helper wraps "read `x-site-id` from
   headers → fetch/cached-lookup the full `sites` row" so pages get
   `{ id, language, theme, brandName, ... }` in one call instead of just the
   id.

**Query-scoping discipline** (top risk called out in
`multi-site-architecture.md`): every Supabase query for a content table goes
through a helper like `scoped(supabase, 'coupons').select(...)` that forces
`.eq('site_id', siteId)`, rather than trusting each call site to remember it.
A missing filter mixes two countries' catalogs — treat it as a security bug,
same severity as a missing permission check.

This slots into the existing middleware security layers from
`architecture.md` (request smuggling / WebSocket origin / header hygiene /
rate limit / session check) — tenant resolution runs first, before the
security checks that follow, since some of those checks (CSP `connect-src`
per domain, rate-limit bucket) may eventually want the site id too.

---

## 3. i18n dictionary scaffold approach (not yet written)

- `src/lib/i18n/dictionaries/fr.ts`, `de.ts` — each exports a single `const
  dict = {...} satisfies Dictionary` object. `Dictionary` is one TypeScript
  interface (`src/lib/i18n/types.ts`) covering every UI-chrome string used
  anywhere in the shared frontend (nav labels, buttons, empty states, form
  validation messages, footer, cookie banner, etc.), grouped by section
  (`nav`, `storePage`, `couponCard`, `newsletter`, `footer`, ...).
- Because every language file is typed against the same `Dictionary`
  interface, **adding `de.ts` without a key fails `tsc`** — this is what
  makes "no hardcoded string" enforceable by the compiler instead of by
  review discipline alone.
- `getDictionary(language: string): Dictionary` — a plain lookup (`{ fr, de
  }[language]`), called once per request in the root layout from the site
  context resolved in middleware, then passed down via a lightweight
  `LangProvider` (React context) for client components, mirroring the
  existing admin pattern (`LangContext` in `architecture.md`) but on the
  public frontend too.
- **Content vs chrome distinction stays explicit**: store descriptions,
  coupon titles, FAQs etc. are *content*, authored/generated per site in
  `sites.language` and stored in the DB (`stores.content_body`) — they don't
  go through the dictionary. The dictionary is strictly UI chrome: labels,
  buttons, static copy that isn't per-store.
- Lint rule of thumb for review (no tooling required for Phase 0, but stated
  now so it's enforced from the first PR): a component may not contain a
  bare string literal in JSX text/`aria-label`/`placeholder`/`alt` — it must
  come from `dict.section.key` or from a DB field.

---

## 4. Phase order (confirmed, from `multi-site-architecture.md`)

| Phase | Scope |
|---|---|
| **0** | Foundations & schema — *this doc* |
| 1 | Tenant resolution: middleware host→site_id, site context server+client, dev overrides |
| 2 | Auth/security + admin shell + site switcher + "Add country" form |
| 3 | Shared frontend (built once, fully dictionary+theme-driven); store page full reveal flow; per-site slug pattern |
| 4 | Networks + auto-add scraper, keyed per site (FR first) |
| 5 | AI content pipeline generating in `sites.language` |
| 6 | Per-domain sitemap/robots + SEO schema + canonical/OG per site |
| 7 | PWA/push (per-site VAPID) + analytics (per-site GA + consent) |
| 8 | Seed & launch France — catalog built fresh via FR automation |
| 9 | Add Germany via the Add-country form (proves "new country = config + content, no new code") |
| future | UK/Spain = repeat Phase 9 only |

No phase is skipped or reordered; store acquisition (Phase 4) starts before
frontend polish finishes so the catalog has time to grow before launch.

---

## 5. What I need from you before Phase 1

**Infrastructure**
- [ ] Supabase project (EU region) — project URL + anon key + service-role key
- [ ] BunnyCDN pull zone (origin = that Supabase Storage URL) — hostname
- [ ] Domain for France (and, whenever ready, Germany) — so I can fill in the
      seed row's `primary_domain` / `site_url` instead of the placeholders

**API keys**
- [ ] DeepSeek API key (content + review generation)
- [ ] Anthropic API key (scraper extraction, category auto-assign)
- [ ] Firecrawl API key (competitor page scraping)

**Affiliate networks — France**
- [ ] Awin FR publisher ID + API key (new, not reused from another site)
- [ ] Kwanko credentials
- [ ] Effiliation credentials
- [ ] Tradedoubler FR, if you want it in scope for Phase 4

**Push / analytics**
- [ ] Nothing needed from you here yet — VAPID keypairs are generated per
      site by the admin's "Add country" flow (Phase 2/7), not supplied
      manually
- [ ] GA4 property + measurement ID for France (Germany's comes later via
      Phase 9)
- [ ] Google Search Console verification token for France's domain

I'll hold Phase 1 until you confirm the schema above (especially the FR seed
row's domain/brand name) and share what's ready from this list — partial is
fine, the ones you don't have yet (e.g. GA4, GSC) can slot in at Phase 6/7
instead of blocking Phase 1.
