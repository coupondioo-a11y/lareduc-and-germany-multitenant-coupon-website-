# Performance

Each item below was a real PageSpeed finding. Mobile is the score that
suffers; desktop was consistently fine while mobile lagged.

## Images — the largest win by far

### Resize at upload, not later

Heroes arrived at 1360–1635px and up to 1.3 MB each while displaying at ~714px.
Total hero payload was 6.7 MB; after re-encoding, 430 KB.

```ts
const HERO_MAX_WIDTH = 760          // cards render at ~714 CSS px

async function toOptimizedWebp(file: File, maxWidth: number): Promise<Buffer> {
  return sharp(Buffer.from(await file.arrayBuffer()))
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 75 })
    .toBuffer()
}
```

Always store as `.webp` with a fixed extension so the path is predictable.
Fixing this retroactively means re-processing every existing file — do it in
the upload handler from day one, and during any bulk import.

### Route every image through the CDN helper

A CDN in front of Supabase Storage fixes the short cache TTL that object
storage sends (1 h → 30 days).

```ts
const SUPABASE_ORIGIN = 'https://<project>.supabase.co'
const CDN_HOST = process.env.NEXT_PUBLIC_CDN_HOST || '<zone>.b-cdn.net'

export function cdnUrl(url: string | null | undefined, width?: number): string {
  if (!url) return ''
  if (!CDN_HOST || !url.startsWith(SUPABASE_ORIGIN)) return url
  return `https://${CDN_HOST}${url.slice(SUPABASE_ORIGIN.length)}`
}
```

**Every** `<img>` rendering a storage URL must call this — including inside
shared components. Missing a few call sites leaves the warning fully in place.
Verify by counting hosts in the rendered DOM:

```js
[...document.images].reduce((a,i)=>{const h=i.src.split('/')[2];a[h]=(a[h]||0)+1;return a},{})
```

Two configuration points that are easy to get wrong:
- The pull zone's **origin must be the storage URL**, not your website domain.
  Pointing it at the site produces 404s on every image.
- Hardcode the CDN hostname as a default. It's a public URL, not a secret, and
  as a `NEXT_PUBLIC_` var it otherwise requires a full rebuild to take effect.

### LCP

```tsx
<img src={cdnUrl(slide.image_url, 760)}
     fetchPriority={i === 0 ? 'high' : undefined}
     loading={i === 0 ? 'eager' : 'lazy'} />
```
First carousel slide eager and high priority; everything else lazy.

## CSS delivery

A 13 KB stylesheet blocked first render for ~390 ms. Next can inline it:

```js
experimental: { inlineCss: true }
```

Verify the built HTML contains `<style>` blocks and zero
`<link rel="stylesheet">`.

## JavaScript

A modern `browserslist` stops SWC emitting `core-js` polyfills for
`Array.prototype.at/flat/flatMap`, `Object.fromEntries/hasOwn`,
`String.prototype.trimStart/trimEnd` — about 12 KB:

```json
"browserslist": [
  "chrome >= 93", "edge >= 93", "firefox >= 92",
  "safari >= 15.4", "ios_saf >= 15.4", "not dead"
]
```

**This change is invisible until you clear the build cache.** Webpack reuses
`.next/cache` and emits an identical chunk hash. `rm -rf .next/cache` then
rebuild, and confirm the polyfills are actually gone from the chunks.

## Cache headers for `/public`

```js
{
  source: '/:file(.*\\.(?:webp|png|jpg|jpeg|svg|ico|avif))',
  headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
}
```

The naive form `/:file*.(webp|png)` **never matches single-segment paths** like
`/badge.webp`, because `:file*` splits on `/`, not `.`. Use one param with an
explicit regex covering the whole path.

## Rendering and data

- Homepage ISR 3600s, store pages 86400s.
- Wrap homepage data aggregation in `unstable_cache`. The root layout calls
  `headers()`, which forces per-request rendering — without the cache every
  navigation re-runs ~10 database queries before painting.
- Never load a large table into the client to filter it (see `pitfalls.md` #5).

## Verifying a performance fix

Check the **live** output, not a saved report. Cached PageSpeed results caused
two rounds of debugging on already-fixed problems. Confirm directly:

```bash
curl -sI "https://<cdn-host>/<path>.webp" | grep -i cache-control
```

Then re-run PageSpeed fresh, and allow the previous origin TTL to expire before
judging the caching score.
