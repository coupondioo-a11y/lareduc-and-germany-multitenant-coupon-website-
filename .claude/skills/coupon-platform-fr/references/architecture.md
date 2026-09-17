# Architecture

## Stack

```
next                  15.5.22    App Router, React 18, TypeScript
@supabase/supabase-js ^2.108.2   DB client
@supabase/ssr         ^0.12.0    Cookie auth for RSC + middleware
@ducanh2912/next-pwa  ^10.2.9    Service worker
sharp                 ^0.35.3    Upload-time image resize
web-push              ^3.6.7     VAPID push
lucide-react          ^1.18.0    Icons (SVG — never emoji as icons)
tailwindcss           ^3.4.1
```

### Dependency policy

Keep an `overrides` block pinning security patches for transitive deps
(`postcss`, `brace-expansion`, `fast-uri`, `js-yaml`, `sharp`,
`serialize-javascript`, `glob`). This is what holds `npm audit` at 0.

**Do not add `shadcn` as a dependency.** It is a scaffolding CLI, never
imported at runtime, and pulls ~186 packages including `hono` with active
CVEs. Vendor primitives under `src/components/ui` and run
`npx shadcn@latest add …` on demand.

Set a modern `browserslist` (Chrome/Edge ≥93, Firefox ≥92, Safari ≥15.4) so
SWC stops emitting `core-js` polyfills for `Array.at`, `Object.hasOwn`,
`String.trimEnd` etc.

---

## Directory layout

```
src/
├── app/
│   ├── layout.tsx          Root layout, metadata, fonts, verification tag
│   ├── page.tsx            Homepage (ISR 3600)
│   ├── globals.css         Design tokens + all layout CSS
│   ├── store/[slug]/
│   │   ├── page.tsx        Server: data fetch + JSON-LD
│   │   ├── StorePageClient.tsx
│   │   └── [id]/           Coupon reveal interstitial
│   ├── all-stores/[letter]/  A–Z directory (SSG)
│   ├── coupon-category/[slug]/
│   ├── special/[slug]/     Seasonal landing pages (SSG)
│   ├── blog/[slug]/
│   ├── admin/              16 permission-gated sections
│   ├── actions/            Server Actions ("use server")
│   └── api/                Route handlers
├── components/             Shared + admin/ layout/ pwa/ store/ ui/
├── lib/
│   ├── supabase/           admin.ts (service role) · client.ts · server.ts
│   ├── seo/                generate-{content,extras,reviews,title}.ts
│   ├── networks/           Affiliate network adapters
│   ├── security/           verify-admin · sanitize · password-validator
│   ├── admin-auth.ts  cdn.ts  deepseek.ts  text-clean.ts  types.ts
└── middleware.ts           Auth gate + security layer
agents/                     Standalone Playwright scraper (own package.json)
migrations/                 Idempotent .sql — run in the Supabase SQL editor
.github/workflows/          Scraper + weekly content cron
```

`trailingSlash: true` — every internal link must end in `/`.

---

## Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never in a client component

# Site
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CDN_HOST=           # <zone>.b-cdn.net (also hardcoded as default)

# Affiliate networks — market-specific
AWIN_PUBLISHER_ID=  AWIN_API_KEY=
TRADEDOUBLER_SITE_ID=  TRADEDOUBLER_PRODUCTS_TOKEN=  TRADEDOUBLER_VOUCHERS_TOKEN=
# (FR used Kwanko + Effiliation; other markets differ — see german-market.md)

# AI
DEEPSEEK_API_KEY=               # content + review generation
ANTHROPIC_API_KEY=              # scraper extraction, category auto-assign
FIRECRAWL_API_KEY=              # competitor page scraping

# Push — generate a fresh keypair per site
NEXT_PUBLIC_VAPID_PUBLIC_KEY=  VAPID_PRIVATE_KEY=  VAPID_EMAIL=

# Automation
CRON_SECRET=
WORKFLOW_PAT=                   # GitHub Actions dispatch
```

Remember the build-time vs runtime split (SKILL.md §5).

---

## Auth model

Supabase Auth (email/password) **plus** an `admin_profiles` row. Both are
required — a valid session without an active profile is rejected.

12 permissions:
```ts
'stores' | 'coupons' | 'categories' | 'flagged' | 'automation' | 'auto_add'
| 'users' | 'site_content' | 'seo_content' | 'newsletter'
| 'push_notifications' | 'security'
```

Enforced at four layers — implement all of them:

1. **`middleware.ts`** — session + `is_active` profile check before any
   `/admin/*` page or protected API route renders.
2. **Page** — `getCurrentAdminProfile()` + `hasPermission()` → `<AccessDenied/>`.
3. **Server Action / route handler** — `requirePermission('x')` throws.
4. **Sidebar** — hides inaccessible nav items. UX only, never security.

`getCurrentAdminProfile()` returns `null` when there is no profile row or
`is_active === false`. Fail closed.

---

## Middleware security layers

In execution order:

1. **Request smuggling** — reject `Content-Length` + `Transfer-Encoding`
   together; reject bodies on `DELETE`/`OPTIONS`; reject any
   `Transfer-Encoding` value other than exactly `chunked`.
2. **WebSocket origin validation** — 403 unless `Origin` is allowlisted.
3. **Header hygiene** — strip inbound `x-nextjs-data` (cache poisoning) and
   `x-admin-id` (only middleware may set it).
4. **Empty User-Agent** → 403.
5. **Rate limit** — 100 req/min per IP on admin surfaces.
6. **Session + active-profile check.**

Cron jobs authenticate with `Authorization: Bearer $CRON_SECRET`, which
short-circuits the session check.

### CSP (`next.config.mjs`)

```
default-src 'self'
script-src  'self' 'unsafe-inline' 'unsafe-eval'
style-src   'self' 'unsafe-inline' fonts.googleapis.com
font-src    'self' fonts.gstatic.com data:
img-src     'self' data: blob: *.supabase.co *.b-cdn.net <domain>
connect-src 'self' *.supabase.co wss://*.supabase.co <network-apis> fcm.googleapis.com
frame-ancestors 'self'
worker-src 'self' blob:
```

Plus HSTS (2y, preload), `X-Frame-Options: SAMEORIGIN`, `nosniff`,
`Referrer-Policy`, `Permissions-Policy` (camera/mic/geo off), and RSC `Vary`
headers to prevent prefetch cache poisoning.

Document any platform limitation you can't fix (e.g. no reverse-proxy access
on shared hosting) in a `SECURITY_NOTES.md` so it reads as an accepted,
understood limit rather than an oversight in a future audit.

---

## Admin panel

16 sections, each permission-gated: Dashboard · Stores · Coupons · Categories ·
Flagged · Automation · Auto-Add · Logo Manager · Site Content · SEO Content ·
Blog · PWA & Push · Newsletter · Reviews · Security (+ Allowed IPs) · Users.

The admin UI is driven by a dictionary in `src/lib/i18n.ts` consumed through
`LangContext`. Adding a language key translates the entire admin.

---

## Automation

Cron runs through GitHub Actions (not the host):

```
coupon-pipeline.yml            daily 03:00 UTC   Playwright scrape batch
                               Sun  02:00 UTC   affiliate store refresh
weekly-content-generation.yml  Mon  04:00 UTC   AI content, ~75 stores
```

The scraper lives in `agents/` as a standalone Node package with its own
`package.json`, structured as a 4-stage pipeline: discover → scrape → extract →
sync.

Store-page data flow on update: network sync (Awin etc.) → fallback to
competitor scraping if no new offers → recount `coupon_count` → background
Playwright pipeline for codes → background AI content + review seeding.
