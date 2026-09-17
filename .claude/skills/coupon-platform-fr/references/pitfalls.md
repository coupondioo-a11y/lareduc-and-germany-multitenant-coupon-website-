# Pitfalls — 25 real production bugs

Every one of these happened. When something breaks, scan here first.

---

## Database & data access

**1. Public write rejected by RLS.** Newsletter signup returned "server error"
for weeks. The route used the anon client; the table has no anon INSERT policy
→ `42501 new row violates row-level security policy`.
**Fix:** use `createAdminClient()` in server-only routes that write.

**2. Query silently returned nothing.** An admin list showed "no subscribers"
while rows existed. It ordered by `subscribed_at` and rendered `is_active` —
neither column exists (the table is `id, email, created_at`). An invalid column
in `.order()` fails the entire query.
**Fix:** verify columns against the live DB. Print one row, read its keys.

**3. Upsert rejected by a NOT NULL column.** `upsert({id, permissions})` failed
because `admin_profiles.email` is NOT NULL — Postgres validates the INSERT arm
even when the row exists.
**Fix:** `UPDATE … WHERE id`, falling back to INSERT with all required columns
only when no row was affected.

**4. Embedded join typed as an array.** `store:stores(name,slug)` returns `[]`
not `{}`; TypeScript rejects assigning it to an object type.
**Fix:** `Array.isArray(r.store) ? r.store[0] ?? null : r.store`.

**5. Large table filtered in memory.** The admin coupon page loaded the 2,000
newest of 14,454 coupons and filtered client-side, so stores whose coupons
predated the cutoff appeared to have **zero**. The search box also matched only
title/code, not store name — so searching a store returned a random-looking
subset of its coupons.
**Fix:** a server action querying the whole table by store id / store name /
title / code, debounced from the UI.

---

## Error handling

**6. A silent `try/finally`.** The upsert failure above was invisible because
the handler had no `catch`. A dead button with no console output.
**Fix:** always `catch` and surface the message in the UI.

**7. Best-effort work that failed silently.** Review seeding was fire-and-forget;
when the AI key was misconfigured it added nothing and said nothing.
**Fix:** log failures, and give user-triggered actions a real return value with
visible success/error feedback.

---

## Environment & deployment

**8. Env var set but not picked up.** Server vars are read at **process start**.
Setting one in the host panel does nothing to a running process.
**Fix:** restart. And make the error message say so.

**9. Env var name mismatch.** The key was stored as `PROJECT_DEEPSEEK` while
the code read `DEEPSEEK_API_KEY` → "not configured" despite looking set.
**Fix:** exact names; optionally accept a fallback name.

**10. `NEXT_PUBLIC_` var had no effect after deploy.** It is inlined at **build**
time; the host had only restarted.
**Fix:** full rebuild. For public non-secrets (CDN host), hardcode a default so
there's no build dependency at all.

**11. A build-config change did nothing.** `browserslist` didn't apply because
webpack reused `.next/cache` and emitted an identical chunk hash.
**Fix:** `rm -rf .next/cache && npm run build`, then verify the output changed.

**12. Debugging a bug that was already fixed.** A PageSpeed report showed
supabase.co image URLs after the CDN was live — the report was cached from
before the deploy.
**Fix:** check the live site's actual output before assuming the code is wrong.

---

## Migrations

**13. `ERROR: 42601: syntax error at or near "migrations"`.** The *filename* was
pasted into the SQL editor instead of the file contents.

**14. Deploy/migration ordering.** Code referencing a new column crashed
because the migration hadn't run yet.
**Fix:** make writes retry without the new column, and reads use `select('*')`.

**15. An optional-boolean gate that never activated.** Filtering
`is_seeded === false` meant that before the migration — when the column is
`undefined` — nothing qualified and the feature stayed dark.
**Fix:** default to the safe side: `is_seeded !== true`.

---

## Content generation

**16. Markdown leaked into rendered pages.** The model emitted `**bold**`
despite the prompt forbidding it; asterisks appeared literally on live pages.
**Fix:** strip at generation (DB stays clean) **and** at render (fixes rows
already stored). Both layers.

**17. Run-on numbered steps.** "1. do this 2. do that" arrived as one
paragraph.
**Fix:** detect the inline pattern and render a real `<ol>`.

**18. New stores had no extended content.** Only the *update* path generated
it; **create never did**, so freshly-added stores looked broken.
**Fix:** wire generation into create as well, plus a manual per-row button.

**19. Generation depended on an external API being up.** No fallback meant no
content at all when it failed.
**Fix:** static template pool as fallback.

---

## SEO

**20. Uncontained content block.** The bottom SEO text rendered bare against
the dark background with no card or heading.
**Fix:** wrap in the glass-card section with a contextual H2.

**21. Rating schema built from AI-generated reviews.** `AggregateRating` from
fabricated reviews violates Google's review-snippet policy and risks a manual
action that removes **all** rich results sitewide.
**Fix:** flag generated rows (`is_seeded`) and build schema only from genuine
ones; emit no `Product` block when there are none.

---

## Performance & assets

**22. CDN applied to only some images.** Hero and footer used the helper;
store logos, similar-store logos and sidebar banners didn't — so the caching
warning persisted after the "fix".
**Fix:** route every image through the helper, including inside shared
components. Verify by counting hosts in the DOM.

**23. Oversized images.** Heroes were 1360–1635px, up to 1.3 MB each, displayed
at ~714px. Total 6.7 MB.
**Fix:** re-encode existing files in place (same URLs) **and** resize on upload
so they can't come back. Result: 430 KB.

**24. Cache header never matched.** Pattern `/:file*.(webp)` — `:file*` splits
on `/`, not `.`, so single-segment paths like `/badge.webp` never matched.
**Fix:** a single param with an explicit regex over the whole path.

---

## Accessibility

**25. A cluster of PageSpeed failures at once.** 8px carousel dots (below the
44px minimum), icon-only buttons with no accessible name, links whose text was
`hidden sm:inline` (no name on mobile), and text at `.3`–`.4` opacity failing
contrast.
**Fix:** padded 44px hit areas around small visuals, `aria-label` everywhere,
contrast floor `.55`. Cheaper to build in than to retrofit.

---

## Dependencies

**Bonus.** 27 CVEs appeared in a single week — newly disclosed upstream, not a
regression. Resolved by upgrading the framework (the only runtime-facing
issues), **removing `shadcn`** (a build-time CLI that dragged in 186 packages
including `hono`), and pinning build-only transitives via `overrides`.

**Lesson:** audit findings are usually upstream disclosures, not something you
broke. Triage by whether the package actually runs in production.
