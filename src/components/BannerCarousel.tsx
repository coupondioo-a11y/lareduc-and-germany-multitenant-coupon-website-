"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BrandTile } from "./BrandMark";
import type { Store } from "@/lib/types";

export interface HeroBanner {
  id: string;
  headline: string;
  figure: string;
  cta: string;
  from: string;
  to: string;
  store: Store;
}

export function BannerCarousel({ banners }: { banners: HeroBanner[] }) {
  const [i, setI] = useState(0);
  if (banners.length === 0) return null;

  const banner = banners[i];
  const go = (d: 1 | -1) => setI((v) => (v + d + banners.length) % banners.length);

  const arrow =
    "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-hair bg-paper text-ink shadow-lift transition-colors duration-200 hover:bg-surface lg:inline-flex";

  return (
    <div className="relative">
      <button type="button" aria-label="Offre précédente" onClick={() => go(-1)} className={`${arrow} -left-5`}>
        <ChevronLeft size={20} aria-hidden />
      </button>

      <article
        className="relative overflow-hidden rounded-panel shadow-lift"
        style={{ background: `linear-gradient(135deg, ${banner.from} 0%, ${banner.to} 100%)` }}
      >
        <span className="absolute left-0 top-0 z-10 rounded-br-card bg-sienna px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
          Exclusif
        </span>

        <span
          aria-hidden
          className="pointer-events-none absolute -right-4 bottom-0 select-none text-[130px] font-extrabold leading-none tracking-tighter text-black/10 sm:right-10 sm:text-[190px]"
        >
          {banner.figure}
        </span>

        <div className="relative flex min-h-[260px] flex-col justify-end gap-4 p-6 sm:min-h-[320px] sm:p-8">
          <BrandTile store={banner.store} size={72} />
          <div>
            <p className="text-sm font-semibold text-black/70">{banner.store.name}</p>
            <p className="mt-1 max-w-lg text-xl font-bold leading-snug text-black sm:text-2xl">
              {banner.headline}
            </p>
          </div>
          <Link
            href={`/store/${banner.store.slug}/`}
            className="inline-flex h-11 w-fit items-center rounded-card bg-primary px-5 text-[15px] font-semibold text-primary-ink transition-opacity duration-200 hover:opacity-90"
          >
            {banner.cta}
          </Link>
        </div>
      </article>

      <div className="mt-4 flex justify-center gap-1">
        {banners.map((b, n) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Afficher l'offre ${n + 1} sur ${banners.length}`}
            aria-current={n === i}
            onClick={() => setI(n)}
            className="inline-flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`block h-2 w-2 rounded-full transition-colors duration-200 ${
                n === i ? "bg-slate-900" : "bg-slate-300"
              }`}
            />
          </button>
        ))}
      </div>

      <button type="button" aria-label="Offre suivante" onClick={() => go(1)} className={`${arrow} -right-5`}>
        <ChevronRight size={20} aria-hidden />
      </button>
    </div>
  );
}
