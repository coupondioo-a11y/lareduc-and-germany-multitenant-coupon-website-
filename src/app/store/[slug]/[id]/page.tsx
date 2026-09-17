import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CouponRevealClient } from "@/components/CouponRevealClient";
import { coupons, couponByPublicId, getStore, stores } from "@/lib/fixtures";
import type { Coupon, Store } from "@/lib/fixtures";

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Fresh build: no wp_post_id fallback, only public_id (see
// references/store-page-flow.md — "a fresh build can drop it but must
// keep public_id").
function findCoupon(numericId: number): { coupon: Coupon; store: Store } | null {
  if (!Number.isFinite(numericId)) return null;
  const coupon = couponByPublicId(numericId);
  if (!coupon) return null;
  const store = getStore(coupon.storeSlug);
  if (!store) return null;
  return { coupon, store };
}

export function generateStaticParams() {
  return coupons.map((c) => ({ slug: c.storeSlug, id: String(c.publicId) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = findCoupon(Number(id));
  if (!found) return {};
  const { coupon, store } = found;
  const hasCode = coupon.type === "code" && !!coupon.code;
  return {
    title: `${hasCode ? "Code promo" : "Offre"} ${store.name} : ${coupon.title}`,
    description: coupon.title,
    alternates: { canonical: `${SITE_URL}/store/${store.slug}/${coupon.publicId}/` },
  };
}

export default async function CouponRevealPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const found = findCoupon(Number(id));
  if (!found) notFound();
  const { coupon, store } = found;

  // Canonical redirect — wrong slug in the URL.
  if (store.slug !== slug) {
    permanentRedirect(`/store/${store.slug}/${coupon.publicId}/`);
  }

  const hasCode = coupon.type === "code" && !!coupon.code;
  const similar = stores
    .filter((s) => s.slug !== store.slug && s.categorySlug === store.categorySlug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": hasCode ? "DiscountCode" : "Offer",
    name: coupon.title,
    description: coupon.title,
    category: "Coupon",
    priceCurrency: "EUR",
    price: "0",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: store.name },
    url: `${SITE_URL}/store/${store.slug}/${coupon.publicId}/`,
    ...(coupon.discountValue ? { discount: coupon.discountValue } : {}),
    ...(hasCode ? { code: coupon.code } : {}),
    ...(coupon.expiryDate ? { validThrough: coupon.expiryDate } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CouponRevealClient store={store} coupon={coupon} similar={similar} />
    </>
  );
}
