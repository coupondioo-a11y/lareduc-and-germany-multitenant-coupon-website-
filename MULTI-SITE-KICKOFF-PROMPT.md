# Multi-country coupon platform — kickoff prompt (greenfield)

Run this inside `D:\coupon-fr-new` in a fresh Claude Code session. This project
is built multi-tenant from day one — France and Germany (and future countries)
are all sites inside this one codebase.

```
You are building a multi-country coupon platform from scratch on Next.js 15
(App Router) + Supabase/Postgres, with a custom React admin panel. This is a
GREENFIELD multi-tenant build — France, Germany, and future countries (UK,
Spain) are all "sites" inside this single codebase, database, and admin. There
is no migration and no live site to protect.

Read the coupon-platform-fr skill first, especially
references/multi-site-architecture.md (the locked architecture + phase plan),
plus references/store-page-flow.md, database.md, architecture.md, and
french-market.md. Use the ui-ux-pro-max, frontend-design, and apple-design
skills for the shared frontend, and ponytail for lean code.

Locked decisions (do not re-litigate):
- ONE multi-tenant project hosts ALL countries. Germany is a site inside it, not
  a separate project.
- Logical separation: ONE database, a site_id on EVERY content row from the
  first migration. Countries never mix; ONE admin manages all, switches between
  them, and can add a new country via a form.
- Domain-based tenancy from the Host header (NOT a /fr /de path switch).
- Every catalog is built FRESH via automation (network sync + competitor
  scraper). No data imports for any country.
- Store URLs keep the /store/ prefix with a per-site slug pattern inside:
  FR 'code-promo-{store}', DE '{store}-gutschein'. Editable per site in admin.
- The frontend is designed ONCE and shared across all sites; only content,
  language, branding (logo/name/colors), sitemap and robots change per site.
- i18n from the first commit: no user-facing string is ever hardcoded in a
  component — everything goes through a per-language dictionary keyed by the
  site's language. Enforce this from the first PR.
- TimeOne is banned on every site, forever.

Do NOT write code yet. Start with PHASE 0 and produce:
- The finalized sites + site_secrets schema and ALL content tables WITH site_id
  and per-site unique constraints (idempotent SQL), plus the FR seed site row.
- The tenant-resolution design for middleware.ts (host -> site_id, dev override).
- The i18n dictionary scaffold approach (structure + how components consume it).
- The full phase order confirmed (Phases 1-9 from the reference).
- A list of everything you need from me: Supabase EU project, BunnyCDN zone,
  DeepSeek/Anthropic/Firecrawl keys, Awin FR (+ later DE) creds, per-site VAPID
  keypairs, GA4 IDs, GSC tokens, and the domains for France and Germany.

Then wait for my go-ahead before Phase 1, and work strictly phase by phase,
verifying each phase (tsc, build, real flow) before the next.
```

## Notes

- This **supersedes the separate `D:\coupon-de-new` project** — Germany is now
  a site inside this one. You can ignore/archive `coupon-de-new`.
- The completed `codepromoreduc` stays live and separate; this project does not
  touch it and does not copy its data or design.
- Adding UK/Spain later is just the Phase 9 "Add country" flow — no new code.
