# Store page — coupon reveal flow (affiliate window, coupon/deal id, popup)

This is the exact interactive workflow of the store page, reverse-engineered
from the production reference build. A frontend that renders the sections but
skips this flow is incomplete. Three mechanisms work together.

---

## 1. The coupon/deal id — `public_id` (the addressable URL)

Every coupon row has a **`public_id`** (stable numeric id). This is the
"coupon id / deal id" that makes each offer individually addressable and
indexable.

- The reveal URL for any coupon is: **`/store/{slug}/{public_id}/`**
  (the `app/store/[slug]/[id]/` dynamic route).
- The `[id]/page.tsx` server component resolves the coupon by looking up
  **`public_id` first**, then falling back to `wp_post_id` (legacy import id):

  ```ts
  async function findCoupon(supabase, numericId) {
    const byPublic = await supabase.from('coupons').select('*, store:stores(*)')
      .eq('public_id', numericId).single()
    if (byPublic.data) return { coupon: byPublic.data, foundBy: 'public_id' }
    const byWp = await supabase.from('coupons').select('*, store:stores(*)')
      .eq('wp_post_id', numericId).single()
    return { coupon: byWp.data, foundBy: 'wp_post_id' }
  }
  ```

- **Canonical redirects** (SEO — do not skip):
  - Found by `wp_post_id` and a `public_id` exists → 301 to the `public_id` URL.
  - `store.slug !== slug` in the URL → redirect to the correct slug.
- Each reveal page emits its own metadata + JSON-LD (`DiscountCode` when the
  coupon has a code, else `Offer`), so every deal is its own indexable page.

For a scratch build with no WordPress, `public_id` is still required — assign
a stable numeric id to every coupon at creation (a sequence/serial column).
The `wp_post_id` fallback is only for migrated sites; a fresh build can drop it
but must keep `public_id`.

---

## 2. The affiliate-window-open pattern (the two-tab reveal)

This is the signature coupon-site interaction. It lives in the reveal button
(`CouponRevealButton`) used on both store-page coupon cards and homepage cards.

On click (`handleActivate`):

```ts
const handleActivate = () => {
  // 1. Build the canonical reveal URL from the coupon/deal id
  const revealUrl = (publicId && storeSlug)
    ? `/store/${storeSlug}/${publicId}/`
    : `/fr/coupon-reveal?${params}`   // fallback only if no public_id

  // 2. Open the reveal/interstitial page in a NEW tab, and focus it
  const popup = window.open(revealUrl, `coupon_reveal_${couponId}_${Date.now()}`)
  if (popup) popup.focus()

  // 3. Navigate the CURRENT tab to the merchant — ONLY if it's a real
  //    external URL (never our own domain / a network redirect back to us)
  if (isExternalUrl(affiliateUrl)) {
    window.location.href = affiliateUrl
  }
}
```

Net effect the user sees:
- **New tab** = the reveal popup showing the code (and copy button, newsletter,
  similar stores).
- **Original tab** = navigates to the merchant's site (the affiliate link),
  so they land on the shop ready to paste the code.

`isExternalUrl()` guards against ever sending the user to your own domain or a
known network-redirect host — resolve the outbound URL as
`destination_url → store.affiliate_url → https://{merchantDomain}`, skipping
own/network hosts (see `seo-schema.md` outbound-link hygiene, and never
TimeOne).

### Store-level "visit store" button (separate, simpler)

The store header's "Visiter {store}" button (`StoreClickButton`) is NOT the
reveal flow — it just increments `stores.click_count` and opens
`affiliate_url` in a new tab (`window.open(url, '_blank', 'noopener')`). No
code, no interstitial.

---

## 3. The popup — two variants, pick per UX

### Variant A — new-tab interstitial (canonical, SEO-friendly)

The reveal URL `/store/{slug}/{id}/` renders `CouponRevealClient`, a full-page
modal that IS a real page (so it's shareable and indexable). It shows:

- A blurred `<iframe>` of the store page behind the modal (context).
- A green status bar: "La boutique {store} s'est ouverte dans l'onglet précédent".
- Store logo, discount badge, coupon title.
- **If the coupon has a code**: a dashed code box + "Copier & Aller à la
  boutique" button. On click:
  ```ts
  navigator.clipboard.writeText(couponCode)
    .then(() => { setCopied(true); setTimeout(() => openAffiliate(), 900) })
    .catch(openAffiliate)   // clipboard blocked → still open affiliate
  ```
  (900ms delay lets the user see the "copied" state before the affiliate tab
  opens via `window.open(affiliateUrl, '_blank', 'noopener,noreferrer')`.)
- **If it's a deal (no code)**: "Aucun code requis" + "Voir l'offre sur {store}".
- Newsletter signup (`POST /api/newsletter/subscribe`) and similar-stores
  strip (fetched client-side from `/api/similar-stores?slug=`).
- Close → navigate back to `/store/{slug}/`.

The `hasCode` rule everywhere: **`couponType === 'code' && !!couponCode`.** A
row of type `code` with an empty code renders as a deal, not a code.

### Variant B — in-page modal (`CouponPopup`, no route change)

A state-driven modal (`isOpen` / `onClose`) rendered on the store page itself,
for when you want the reveal to happen without leaving the page. Same content
(logo, discount, code box, copy button, expiry, terms). On copy:

```ts
navigator.clipboard.writeText(couponCode)
setCopied(true)
setTimeout(() => { window.open(affiliateUrl, '_blank'); onClose() }, 900)
```

The reference wires the **reveal button to Variant A** (the addressable
interstitial) as the primary path, because it gives every coupon its own URL.
Variant B is available for card interactions that should stay on the page.

---

## Data each coupon card must pass down

For any of this to work, the coupon card/list must have these fields per
coupon (from the `coupons` table joined to its store):

`id, public_id, code, title, discount_value, type ('code'|'deal'|'free_shipping'),
destination_url, expiry_date` + store `name, slug, logo_url, affiliate_url,
popup_banner_url`.

If `public_id` is missing the flow silently falls back to the query-string
`/fr/coupon-reveal` route — so **guarantee `public_id` on every coupon** or the
canonical, indexable URL is never used.

---

## Checklist to verify the flow is actually wired (not just rendered)

- [ ] Every coupon has a non-null `public_id`.
- [ ] `app/store/[slug]/[id]/` route exists and resolves by `public_id`.
- [ ] Reveal button opens `/store/{slug}/{public_id}/` in a new tab AND sends
      the current tab to the external affiliate URL.
- [ ] `isExternalUrl` guard prevents self-domain / network-redirect navigation.
- [ ] Interstitial copies the code, then opens the affiliate after ~900ms.
- [ ] Deals (no code) show "Voir l'offre" instead of a code box.
- [ ] Canonical 301 redirects for legacy id / wrong slug.
- [ ] `DiscountCode` vs `Offer` JSON-LD chosen by `hasCode`.
- [ ] Store-header "visit" button increments `click_count` and opens affiliate.
