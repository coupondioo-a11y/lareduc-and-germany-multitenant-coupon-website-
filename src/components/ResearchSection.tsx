import Link from "next/link";
import { ArrowRight, Database, Radar, ShieldCheck } from "lucide-react";
import { BrandTile } from "./BrandMark";
import { siteStats, stores } from "@/lib/fixtures";

const sideCards = [
  {
    Icon: ShieldCheck,
    eyebrow: "Vérification",
    title: "Comment nous testons chaque code",
    body: "Test automatisé, confirmation humaine, suivi dans le temps — la méthode complète.",
    cta: "Voir la méthode",
    href: "/a-propos/",
  },
  {
    Icon: Radar,
    eyebrow: "Radar shopping",
    title: "Tendances & économies",
    body: "Classements par ville, tendances par catégorie et conseils tirés de nos données d'usage.",
    cta: "Voir les données",
    href: "/a-propos/",
  },
];

export function ResearchSection() {
  const tiles = stores.slice(0, 15);

  return (
    <section className="bg-night py-16 text-white sm:py-24">
      <div className="mx-auto max-w-shell px-4 sm:px-6">
        <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
          Recherche
        </p>
        <h2 className="mt-5 text-4xl font-extrabold sm:text-5xl">Des données, pas de la publicité.</h2>
        <p className="mt-4 max-w-xl text-[17px] text-white/55">
          Des chiffres réels tirés de notre base de codes — consultables librement, pas vendus.
        </p>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {/* Store index — the wide card */}
          <div className="flex flex-col rounded-panel border border-night-line bg-night-card p-6 sm:p-8 lg:col-span-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/45">
              Index boutiques · 2026
            </p>
            <h3 className="mt-4 text-2xl font-extrabold sm:text-[28px]">
              L&apos;index des boutiques lareduc.fr
            </h3>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/55">
              Toutes les boutiques partenaires classées par catégorie, nombre de codes et taux de
              réussite — en direct depuis notre base, pas depuis un communiqué de presse.
            </p>

            <ul className="mt-8 flex flex-wrap gap-2.5">
              {tiles.map((s) => (
                <li key={s.slug}>
                  <BrandTile store={s} size={54} />
                </li>
              ))}
            </ul>

            <dl className="mt-8 grid grid-cols-3 gap-4 rounded-card bg-black/45 px-4 py-6 text-center">
              {[
                { n: siteStats.shopsListed, l: "Boutiques listées" },
                { n: siteStats.activeCodes, l: "Codes actifs" },
                { n: siteStats.categoryCount, l: "Catégories" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="sr-only">{s.l}</dt>
                  <dd>
                    <span className="block text-2xl font-extrabold text-accent sm:text-[32px]">
                      {s.n}
                    </span>
                    <span className="mt-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/45">
                      {s.l}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              href="/all-stores/a/"
              className="mt-7 inline-flex items-center gap-2 border-t border-night-line pt-6 text-[15px] font-bold text-accent"
            >
              <Database size={17} aria-hidden />
              Voir toutes les boutiques
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          {/* Two stacked side cards */}
          <div className="grid gap-5">
            {sideCards.map(({ Icon, eyebrow, title, body, cta, href }) => (
              <div
                key={eyebrow}
                className="flex flex-col rounded-panel border border-night-line bg-night-card p-6 sm:p-7"
              >
                <Icon size={22} className="text-accent" aria-hidden />
                <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {eyebrow}
                </p>
                <h3 className="mt-3 text-xl font-extrabold">{title}</h3>
                <p className="mt-3 flex-1 text-[15px] leading-relaxed text-white/55">{body}</p>
                <Link
                  href={href}
                  className="mt-6 inline-flex items-center gap-2 text-[15px] font-bold text-accent"
                >
                  {cta}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
