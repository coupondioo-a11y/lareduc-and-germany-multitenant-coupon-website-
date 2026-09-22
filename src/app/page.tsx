import Link from "next/link";
import { BannerCarousel } from "@/components/BannerCarousel";
import { DealGrid } from "@/components/DealGrid";
import { Hero } from "@/components/Hero";
import { Newsletter } from "@/components/Newsletter";
import { PromoCardGrid } from "@/components/PromoCardGrid";
import { ResearchSection } from "@/components/ResearchSection";
import { StatBand } from "@/components/StatBand";
import { StoreShowcase } from "@/components/StoreShowcase";
import { getSiteContext } from "@/lib/site-context";
import {
  getAllStores,
  getFeaturedHomeCoupons,
  getHeroSlides,
  getSiteCounts,
  getSiteStatsRow,
} from "@/lib/db/queries";

function SectionHead({
  title,
  href,
  linkLabel,
  center = false,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${center ? "justify-center text-center" : ""}`}>
      <h2 className={`text-2xl font-extrabold text-ink sm:text-[28px] ${center ? "" : ""}`}>{title}</h2>
      {href && linkLabel && !center ? (
        <Link
          href={href}
          className="shrink-0 text-[12px] font-bold uppercase tracking-[0.12em] text-ink underline underline-offset-4"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const site = await getSiteContext();
  const [stores, featured, banners, counts, stats] = await Promise.all([
    getAllStores(site.id),
    getFeaturedHomeCoupons(site.id, 30),
    getHeroSlides(site.id),
    getSiteCounts(site.id),
    getSiteStatsRow(site.id),
  ]);

  const storeById = new Map(stores.map((s) => [s.slug, s]));
  const items = featured
    .map((coupon) => {
      const store = storeById.get(coupon.storeSlug);
      return store ? { coupon, store } : null;
    })
    .filter((v): v is { coupon: (typeof featured)[number]; store: (typeof stores)[number] } => v !== null);

  const showcaseItems = items.slice(0, 6);
  const topCodeItems = items.slice(0, 12);
  const dealItems = items.slice(0, 10);

  return (
    <>
      <Hero stores={stores} />

      <div className="glass-stage pb-16">
        <div className="mx-auto -mt-24 max-w-shell px-4 sm:px-6">
          <BannerCarousel banners={banners} />
        </div>

        {showcaseItems.length > 0 ? (
          <section className="mx-auto mt-16 max-w-shell px-4 sm:px-6">
            <h2 className="text-center text-2xl font-extrabold text-ink sm:text-[28px]">
              Codes promo populaires des grandes enseignes
            </h2>
            <div className="mt-8">
              <StoreShowcase items={showcaseItems} />
            </div>
          </section>
        ) : null}

        <section id="top-codes" className="mx-auto mt-16 max-w-shell px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-ink sm:text-[28px]">
            Meilleurs codes promo
          </h2>
          <div className="mt-8">
            {topCodeItems.length > 0 ? (
              <PromoCardGrid items={topCodeItems} />
            ) : (
              <p className="text-center text-[15px] text-ink-soft">
                Aucune offre pour le moment. La synchronisation ajoute des boutiques et des codes en
                continu.
              </p>
            )}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href="/all-stores/a/"
              className="inline-flex h-12 items-center rounded-card border border-hair bg-paper px-6 font-semibold text-ink shadow-card transition-colors duration-200 hover:bg-surface"
            >
              Voir plus de réductions
            </Link>
          </div>
        </section>
      </div>

      <StatBand stats={stats} />

      {dealItems.length > 0 ? (
        <div className="glass-stage py-16">
          <section className="mx-auto max-w-shell px-4 sm:px-6">
            <SectionHead title="Top offres" href="/all-stores/a/" linkLabel="Toutes les offres" />
            <div className="mt-6">
              <DealGrid items={dealItems} />
            </div>
          </section>
        </div>
      ) : null}

      <div className="mt-16">
        <ResearchSection stores={stores} brandName={site.brandName} counts={counts} />
      </div>

      {/* Newsletter */}
      <section className="bg-hero py-14 text-white">
        <div className="mx-auto flex max-w-shell flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <h2 className="text-2xl font-extrabold">Recevoir les meilleurs codes</h2>
            <p className="mt-2 text-[15px] text-white/65">
              Un e-mail par semaine avec la poignée de codes qui valent vraiment le détour. Rien
              d&apos;autre.
            </p>
          </div>
          <div className="w-full lg:max-w-md">
            <Newsletter />
          </div>
        </div>
      </section>
    </>
  );
}
