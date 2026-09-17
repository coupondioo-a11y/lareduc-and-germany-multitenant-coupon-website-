# New French coupon site — scratch build (no migration)

Paste this into the new French project's Claude Code session (fresh project,
skill already copied in — see `README.md` for setup steps).

```
You are building a brand-new French coupon/deals website from scratch on
Next.js 15 (App Router) + Supabase/Postgres, with a custom React admin panel.

This is NOT a migration. There is no WordPress, no legacy database, no
store/coupon data of any kind to import. The entire catalog will be built
live, from day one, through two automated pipelines:
1. Affiliate network sync (Awin FR, Kwanko, Effiliation)
2. An auto-add competitor scraper (discover -> scrape -> extract -> sync)
   for stores the networks don't cover

The goal is full BACKEND FEATURE PARITY with a mature, production-proven
French coupon site — every functionality that site has (store automation,
auto-add competitor scraping, AI content generation, structured data, admin
panel, push/PWA, security layers) must exist here too, built in from the
start rather than added later.

The FRONTEND is completely open — no visual identity to match or avoid.
Design it fresh, tuned to the coupon/deals niche.

HARD CONSTRAINT: TimeOne must NEVER be integrated — no adapter, no domains,
no links, ever, regardless of anything found in scraped data.

First, read the coupon-platform-fr skill in .claude/skills/ (SKILL.md and
every file in references/) — it has the full architecture, database schema,
security model, AI content pipeline, and 25 catalogued production pitfalls
from the reference build. Also load the ui-ux-pro-max, frontend-design, and
apple-design skills for the frontend design direction, and keep the ponytail
skill in mind for lean, non-bloated code throughout. Once the frontend phase produces any animation/motion code
(hero, carousel, transitions, hover states), explicitly invoke the
review-animations skill to review it against its high-craft-bar standard
before considering that work done.

Do NOT write any code yet. Produce:
- A short confirmation of the stack and the "full backend, open frontend" split
- A phase-by-phase build plan (schema -> auth/security -> admin -> networks +
  auto-add scraper -> AI content pipeline -> frontend -> PWA/push/analytics ->
  launch) — note there is no import phase
- 2-3 visual direction options for the frontend (palette, type, card style,
  hero concept), derived from a ui-ux-pro-max search for the coupon/deals niche
- A list of everything you'll need from me: new Supabase EU project, BunnyCDN
  zone, DeepSeek key, Anthropic key, Firecrawl key, Awin FR publisher ID,
  Kwanko/Effiliation credentials, VAPID keypair, GA4 ID, Google Search
  Console token, domain name

Wait for my answers before building anything.
```

## After kickoff

Work through the phases it proposes. Two things to watch:

- **Store acquisition is not optional or "phase 9"** — the network sync +
  auto-add scraper are the site's core content engine and should be built
  early enough to start populating the catalog while later phases (frontend
  polish, PWA) are still in progress.
- **Legal pages before launch**: Mentions légales, Politique de
  confidentialité (RGPD), cookie consent banner (Consent Mode v2) — see
  `references/french-market.md` in the skill.
