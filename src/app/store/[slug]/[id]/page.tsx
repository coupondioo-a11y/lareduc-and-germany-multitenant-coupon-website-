import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CouponRevealClient } from "@/components/CouponRevealClient";
import { getSiteContext } from "@/lib/site-context";
import { getCouponByPublicId, getOtherStores } from "@/lib/db/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const site = await getSiteContext();
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) return {};
  const found = await getCouponByPublicId(site.id, numericId);
  if (!found) return {};
  const { coupon, store } = found;
  const hasCode = coupon.type === "code" && !!coupon.code;
  return {
    title: `${hasCode ? "Code promo" : "Offre"} ${store.name} : ${coupon.title}`,
    description: coupon.title,
    alternates: { canonical: `${site.siteUrl}/store/${store.slug}/${coupon.publicId}/` },
  };
}

export default async function CouponRevealPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const site = await getSiteContext();
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const found = await getCouponByPublicId(site.id, numericId);
  if (!found) notFound();
  const { coupon, store } = found;

  // Canonical redirect — wrong slug in the URL.
  if (store.slug !== slug) {
    permanentRedirect(`/store/${store.slug}/${coupon.publicId}/`);
  }

  const hasCode = coupon.type === "code" && !!coupon.code;
  const similar = (await getOtherStores(site.id, store.slug, 3)).filter(
    (s) => s.categorySlug === store.categorySlug
  );

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
    url: `${site.siteUrl}/store/${store.slug}/${coupon.publicId}/`,
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
