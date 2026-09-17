# AI content generation

Store pages are populated by an LLM (DeepSeek `deepseek-chat`, OpenAI-compatible
API, JSON mode). Content is grounded in real database facts so the numbers on
the page are true.

## Pipeline

```
gather-store-facts.ts   Pull live coupon stats from the DB
generate-content.ts     Description, H2 sections, FAQs (tiered)
generate-extras.ts      Policies, expert guide, checkout guide, tips, briefing
generate-reviews.ts     3 seeded reviews (with static fallback)
generate-title.ts       meta_title / meta_description patterns
```

Triggered on: store create, store update, a per-row manual button, and a weekly
cron batch.

## Ground every prompt in real facts

Never let the model invent numbers. Build a facts block from the database and
instruct the model to use only those:

```
Store: {name}
Active offers listed: {n}
Active promo codes: {n}
Best current discount: {value}
Example offers: {titles}
```

Then in the system prompt: *use ONLY the supplied facts; never promise a
discount the facts don't confirm; if something is unknown (exact return policy,
delivery time) stay cautious ("generally", "subject to current terms") rather
than inventing a figure.*

## Prompt rules that actually work

Three things measurably improved output quality:

**Ban markdown explicitly and explain why.** "Plain text only. No asterisks, no
hashes, no backticks, no list dashes. Never write `**word**` for bold — the
page renders the asterisks literally and it's unreadable." Explaining the
consequence works better than just prohibiting.

**Ban filler phrases by name.** List the specific dead phrases in the target
language ("incredible", "revolutionary", "in today's world", "it's important
to note"). Generic instructions to "write naturally" don't land; a banned-word
list does.

**Ask for variation across stores.** "Vary sentence length — some short, some
longer. Vary structure between stores; don't apply an identical template."
Without this every store page reads the same, which is both bad UX and a
thin-content signal.

## Sanitise twice — this is not optional

Models emit markdown despite the instruction. Asterisks reached live pages.

```ts
stripMarkdownDeep(parsed)   // at generation → the DB stays clean
stripMarkdown(value)        // at render     → fixes rows already stored
```

The render-time layer matters because it repairs existing bad data without
regenerating everything — which at 2,000 stores would be slow and expensive.

`stripMarkdown` removes `**bold**`, `*italic*`, `__underline__`, backticks,
leading `#` headings, list dashes, and then any stray `*` (zero tolerance).
`stripMarkdownDeep<T>` recurses through an entire parsed JSON object.

Also useful: `splitNumberedSteps()`, which detects inline "1. … 2. …" prose and
returns structured steps so they can render as a real `<ol>` instead of a
run-on paragraph.

## Always ship a fallback

Review seeding silently produced nothing whenever the API key was
misconfigured. Now it falls back to a randomised pool of templates:

```ts
let reviews = []
try {
  reviews = parseFromLLM(await deepseekChat({ system, user }))
} catch { /* API down or key missing */ }
if (reviews.length === 0) reviews = fallbackReviews(count)
```

Same principle everywhere an external API feeds a user-visible feature.

## Seeded reviews — mark them

Any generated review must be written with `is_seeded: true` so rating schema
can exclude it (`seo-schema.md`). Make the write resilient so it works before
the column exists:

```ts
let { error } = await sb.from('store_reviews').insert(rows.map(r => ({ ...r, is_seeded: true })))
if (error && /is_seeded|column|schema cache/i.test(error.message)) {
  ;({ error } = await sb.from('store_reviews').insert(rows))
}
```

Backdate them across several months and vary helpful-counts — reviews all
dated today are obviously synthetic.

Skip stores that already have enough reviews so repeated runs don't pile up
duplicates.

## Idempotence and cost control

- `generateStoreExtras(id)` returns `{ ok, skipped }` and **skips** when
  content already exists, unless called with `{ force: true }`.
- Batch backfills process ~75 stores per run on a weekly cron.
- Run generation in the background via `after()` so admin actions return
  immediately — but give user-triggered buttons a real awaited result so the
  admin sees success or the actual error.

## Validate shape before saving

Refuse to persist garbage:

```ts
if (!Array.isArray(parsed.policies)
    || !parsed.expert_guide?.sections?.length
    || !parsed.checkout_guide?.steps?.length) {
  return { ok: false, error: 'response failed shape validation' }
}
```

## Language

Prompts must be written **in the target language**, not translated at runtime.
When porting to a new market, rewrite the system and user prompts natively and
keep the anti-markdown / anti-filler rules verbatim — those transfer.

Also localise the fallback review pool (names and phrasing) and the title
generator's month names and patterns.
