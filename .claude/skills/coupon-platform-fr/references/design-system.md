# Design system — this is a fresh build, full creative freedom

This is a brand-new site, not a clone of any sister project. There is **no
fixed palette or component style to copy** — the frontend can be whatever
fits this specific market and niche best. Use the `ui-ux-pro-max` skill to
derive a niche-tuned direction (coupon/deals: directory + e-commerce
patterns) rather than defaulting to a generic look.

What follows is **not** a style spec — it is the set of quality floors and
the functional contract that any coupon platform needs regardless of skin.

## Quality floors (non-negotiable, whatever the palette)

Learned from a real PageSpeed/accessibility audit on the reference build —
these are cheap to build in from day one and expensive to retrofit later.

- **Contrast:** WCAG AA 4.5:1 minimum for body text against its background,
  on every theme offered (light/dark).
- **Touch targets:** ≥ 44×44 px for anything tappable. Small visuals (e.g. an
  8px carousel dot) stay small visually but sit inside a padded button that
  reaches 44px.
- **Accessibility:** `aria-label` on every icon-only button; `aria-label` on
  any link whose text is `hidden sm:inline` (no accessible name on mobile
  otherwise); sequential headings; visible focus rings; `alt` on meaningful
  images.
- **Typography:** body base 16px, never below 12px; 16px minimum on mobile
  form inputs (or iOS auto-zooms on focus); fonts loaded via `next/font` with
  `font-display: swap`.
- **Animation:** micro-interactions 150–300ms, nothing over 400ms; animate
  `transform`/`opacity` only; wrap every transition in a
  `prefers-reduced-motion` guard.
- **Layout:** `box-sizing: border-box` + `width: 100%` on main containers;
  mobile-first; test at 375 / 768 / 1024 / 1440; no horizontal scroll.
- **Icons:** SVG only (Lucide or similar) — never emoji as icons.

## Functional sections a store page must have

The store page is the product, and its content is driven by the AI content
model (`content_body.extras` — see `ai-content.md`). Whatever the visual
design, the store page needs all of these, in this order:

1. Header — logo, H1, star rating, key stats
2. Coupon list — filter tabs (All / Codes / Deals), featured first
3. Intelligence briefing — expandable analysis
4. Purchase policies — cards linking to the merchant
5. Checkout guide — numbered steps
6. Expert guide — H2 sections
7. Pro tips
8. Savings leaderboard — derived from real click counts, never manual entry
9. Customer reviews — average headline, star-to-expand submit prompt, review cards
10. SEO content block — description, H2s, FAQ, inside a contained card with a heading
11. Similar stores

Homepage must surface: hero, featured stores, latest coupons, categories,
newsletter signup, stat bar. Same data bindings as the reference build; the
shell around them is entirely new.

## How to actually pick the design

1. Run `ui-ux-pro-max --design-system` for a coupon/deals + this specific
   market query to get a niche-tuned palette, type pairing, and pattern set.
2. Lock the tokens (colors, type, radius, shadow scale, spacing rhythm) in
   `tailwind.config.ts` / `globals.css` before building components.
3. Apply consistently: one icon set, one elevation scale, one radius token,
   light/dark designed together if both are offered.
