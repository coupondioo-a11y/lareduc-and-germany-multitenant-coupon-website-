import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  couponsForStore,
  getStore,
  ratingFor,
  realReviews,
  reviews as allReviews,
  stores,
} from "@/lib/fixtures";
import { StorePageBody } from "./StorePageBody";

export const revalidate = 86400;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const MONTH_YEAR = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

export function generateStaticParams() {
  return stores.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = getStore(slug);
  if (!store) return {};
  const best = couponsForStore(store.slug).find((c) => c.discountValue)?.discountValue;
  const bestText = best ? `${best} ` : "";
  return {
    title: { absolute: `Code promo ${store.name} : ${bestText}vérifié en ${MONTH_YEAR}` },
    description: `Tous les codes promo ${store.name} testés à la main et datés. ${store.couponCount} offres actives, la meilleure à ${best ?? "consulter"} en ${MONTH_YEAR}.`,
    alternates: { canonical: `${SITE_URL}/store/${store.slug}/` },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = getStore(slug);
  if (!store) notFound();

  const list = couponsForStore(store.slug);
  const rating = ratingFor(store.slug);
  const genuineReviews = realReviews(store.slug);
  const seededCount = (allReviews[store.slug] ?? []).length - genuineReviews.length;
  const otherStores = stores.filter((s) => s.slug !== store.slug);
  const contentApproved = !!store.content; // fixtures: content present == approved

  const hasCode = (code?: string) => !!code && code.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: store.name,
        url: `${SITE_URL}/store/${store.slug}/`,
        description: store.blurb,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Accueil", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: store.category, item: `${SITE_URL}/#categories` },
          { "@type": "ListItem", position: 3, name: store.name, item: `${SITE_URL}/store/${store.slug}/` },
        ],
      },
      {
        "@type": "ItemList",
        itemListElement: list.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": hasCode(c.code) ? "DiscountCode" : "Offer",
            name: c.title,
            description: c.title,
            category: "Coupon",
            priceCurrency: "EUR",
            price: "0",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: store.name },
            ...(c.discountValue ? { discount: c.discountValue } : {}),
            ...(hasCode(c.code) ? { code: c.code } : {}),
            ...(c.expiryDate ? { validThrough: c.expiryDate } : {}),
            url: `https://${store.domain}/`,
          },
        })),
      },
      ...(contentApproved && store.content
        ? [
            {
              "@type": "FAQPage",
              mainEntity: store.content.faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
      ...(genuineReviews.length > 0
        ? [
            {
              "@type": "Product",
              name: `Code promo ${store.name}`,
              brand: { "@type": "Brand", name: store.name },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: rating.value.toFixed(1),
                reviewCount: genuineReviews.length,
                bestRating: 5,
                worstRating: 1,
              },
              review: genuineReviews.slice(0, 10).map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.author },
                datePublished: r.createdAt,
                reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                reviewBody: r.body,
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StorePageBody
        store={store}
        coupons={list}
        rating={rating}
        reviews={genuineReviews}
        seededCount={seededCount}
        otherStores={otherStores}
      />
    </>
  );
}
