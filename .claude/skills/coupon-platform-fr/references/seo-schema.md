# SEO and structured data

## What to emit per page type

| Schema | Where | Notes |
|---|---|---|
| `Organization` | store pages | name, url, logo, description |
| `BreadcrumbList` | all pages | shared helper |
| `ItemList` of `Offer` / `DiscountCode` | store pages | one item per coupon |
| `FAQPage` | store pages | only when `content_status === 'approved'` |
| `WebSite` + `SearchAction` | homepage | enables the sitelinks search box |
| `Product` + `AggregateRating` + `Review` | store pages | **gated — see below** |

## The rating snippet is the biggest CTR lever

A competitor survey found only one of four major coupon sites emitting
`Product` + `AggregateRating`. The one that did gets star ratings in search
results; the others don't. Check the equivalent competitors in your market
before launch — this gap tends to persist.

### Compliance gate — do not relax this

Building `AggregateRating` from AI-generated reviews violates Google's
review-snippet policy. A manual action removes **all** rich results sitewide,
not just stars. The protection:

```ts
// Anything not explicitly flagged as seeded counts as genuine.
// (Use !== true, not === false — before the migration the column is undefined.)
const realReviews = reviews.filter(r => r.is_seeded !== true)

const productJsonLd = realReviews.length > 0 ? {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: `Coupon ${store.name}`,
  brand: { '@type': 'Brand', name: store.name },
  ...(store.logo_url ? { image: store.logo_url } : {}),
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: (realReviews.reduce((s, r) => s + r.rating, 0) / realReviews.length).toFixed(1),
    reviewCount: realReviews.length,
    bestRating: 5, worstRating: 1,
  },
  review: realReviews.slice(0, 10).map(r => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.author_name },
    datePublished: r.created_at.slice(0, 10),
    reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    reviewBody: r.body,
  })),
} : null
```

No genuine reviews → emit no `Product` block at all. The reviews must also be
visibly rendered on the page; schema for invisible content is a violation too.

## Offer items

Each coupon in the `ItemList` should be a complete `Offer`:

```ts
{
  '@type': hasCode(c) ? 'DiscountCode' : 'Offer',
  name: c.title,
  description: c.title,
  category: 'Coupon',
  priceCurrency: 'EUR',
  price: '0',
  availability: 'https://schema.org/InStock',
  seller: { '@type': 'Organization', name: store.name },
  ...(c.discount_value ? { discount: c.discount_value } : {}),
  ...(hasCode(c) ? { code: c.code } : {}),
  ...(c.expiry_date ? { validThrough: c.expiry_date } : {}),
  url: c.destination_url || `${siteUrl}/store/${slug}/`,
}
```

Always resolve a `url` — never leave it undefined.

## Metadata

- Per-store `meta_title` / `meta_description` with generated fallbacks that
  include the best current discount and the current month/year (freshness
  signal in the SERP).
- Use `title: { absolute: … }` on store pages to bypass the root layout's
  `%s | site` template.
- `metadataBase` from `NEXT_PUBLIC_SITE_URL`; canonical via
  `alternates.canonical`.
- OG images generated on the fly at `/api/og/[slug]`.
- Search Console verification through `metadata.verification.google` — it
  renders the exact `<meta name="google-site-verification">` tag and applies
  sitewide.

## Outbound link hygiene

Affiliate links must never point back at your own domain. A fallback chain
that ended at `yoursite.com/store/…` made every "go to merchant" button a
self-link.

Resolve in order: store `affiliate_url` → a coupon's `destination_url` →
`https://{merchantDomain}`, skipping any URL whose host is your own domain or a
known affiliate-network domain. Maintain a `NETWORK_DOMAINS` blocklist
(awin1.com, tradedoubler.com, etc. **plus your own domain**) so network
redirect URLs are never mistaken for the merchant's real website.

All outbound merchant links: `rel="sponsored nofollow noopener noreferrer"`
and `target="_blank"`.

## Rendering strategy

- Homepage ISR 3600s; store pages 86400s.
- A–Z directory and seasonal pages are statically generated.
- Wrap expensive homepage aggregation in `unstable_cache` — the root layout
  uses `headers()`, which forces per-request rendering, so without it every
  navigation re-runs the full query set.

## Before launch

- `robots.txt` actually allows indexing (check it isn't disallowing)
- `sitemap.xml` generated and submitted
- Google Rich Results Test on a store page — verify Product, Offer, FAQ,
  Breadcrumb all parse
- No `noindex` left over from staging
