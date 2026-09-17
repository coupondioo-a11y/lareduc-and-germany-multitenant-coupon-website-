import Link from "next/link";
import { BannerCarousel } from "@/components/BannerCarousel";
import { DealGrid } from "@/components/DealGrid";
import { Hero } from "@/components/Hero";
import { Newsletter } from "@/components/Newsletter";
import { PromoCardGrid } from "@/components/PromoCardGrid";
import { ResearchSection } from "@/components/ResearchSection";
import { StatBand } from "@/components/StatBand";
import { StoreShowcase } from "@/components/StoreShowcase";
import { categories } from "@/lib/fixtures";
import { num } from "@/lib/format";

export const revalidate = 3600;

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

export default function HomePage() {
  return (
    <>
      <Hero />

      <div className="glass-stage pb-16">
        {/* Exclusive banner, straddling the hero */}
        <div className="mx-auto -mt-24 max-w-shell px-4 sm:px-6">
          <BannerCarousel />
        </div>

        {/* Popular codes for top stores */}
        <section className="mx-auto mt-16 max-w-shell px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-ink sm:text-[28px]">
            Codes promo populaires des grandes enseignes
          </h2>
          <div className="mt-8">
            <StoreShowcase couponIds={["z1", "s1", "ue1", "n1", "sh1", "te1"]} />
          </div>
        </section>

        {/* Top promo codes */}
        <section id="top-codes" className="mx-auto mt-16 max-w-shell px-4 sm:px-6">
          <h2 className="text-center text-2xl font-extrabold text-ink sm:text-[28px]">
            Meilleurs codes promo
          </h2>
          <div className="mt-8">
            <PromoCardGrid
              couponIds={["z2", "ue1", "az1", "lm1", "mr1", "a1", "sh1", "ca1", "cp1", "eu1", "f1", "c1"]}
            />
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

      <StatBand />

      <div className="glass-stage py-16">
        {/* Top deals */}
        <section className="mx-auto max-w-shell px-4 sm:px-6">
          <SectionHead title="Top offres" href="/all-stores/a/" linkLabel="Toutes les offres" />
          <div className="mt-6">
            <DealGrid couponIds={["f1", "z1", "n1", "sa1", "c1", "lm1", "ca1", "te1", "eu1", "cp1"]} />
          </div>
        </section>

        {/* Seasonal block */}
        <section id="nouveautes" className="mx-auto mt-16 max-w-shell px-4 sm:px-6">
          <SectionHead
            title="Rentrée : maison & déco"
            href="/all-stores/a/"
            linkLabel="Toutes les offres maison"
          />
          <div className="mt-6">
            <DealGrid couponIds={["lm1", "c1", "te1", "ca1", "mr1", "az1", "sh1", "a1", "s1", "z3"]} />
          </div>
        </section>
      </div>

      {/* Categories */}
      <section id="categories" className="mx-auto mt-16 max-w-shell px-4 sm:px-6">
        <SectionHead title="Parcourir par catégorie" />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <Link
                href="/#categories"
                className="flex items-center justify-between rounded-card border border-hair bg-paper px-4 py-3.5 text-[15px] transition-colors duration-200 hover:bg-surface"
              >
                <span className="font-medium text-ink">{cat.name}</span>
                <span className="text-[13px] text-ink-soft">{num(cat.storeCount)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16">
        <ResearchSection />
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
