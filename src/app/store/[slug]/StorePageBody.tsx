"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, Bookmark, ChevronDown, Clock, Star } from "lucide-react";
import { CouponCard } from "@/components/CouponCard";
import { StoreClickButton } from "@/components/StoreClickButton";
import { StoreLogo } from "@/components/StoreLogo";
import { StarRating } from "@/components/StarRating";
import type { Coupon, Review, Store } from "@/lib/fixtures";
import { dateFr, num } from "@/lib/format";

type Tab = "all" | "code" | "deal";

function Section({
  title,
  children,
  id,
}: {
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="border-t border-hair py-10">
      <h2 className="font-serif text-2xl text-ink">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StorePageBody({
  store,
  coupons,
  rating,
  reviews,
  seededCount,
  otherStores,
}: {
  store: Store;
  coupons: Coupon[];
  rating: { value: number; count: number };
  reviews: Review[];
  seededCount: number;
  otherStores: Store[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const content = store.content;
  const merchantUrl = `https://${store.domain}/`;

  const filtered = useMemo(() => {
    if (tab === "code") return coupons.filter((c) => c.type === "code");
    if (tab === "deal") return coupons.filter((c) => c.type !== "code");
    return coupons;
  }, [tab, coupons]);

  const leaderboard = useMemo(
    () => [...coupons].sort((a, b) => b.usedCount - a.usedCount).slice(0, 4),
    [coupons],
  );

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: "all", label: "Tous", n: coupons.length },
    { id: "code", label: "Codes", n: coupons.filter((c) => c.type === "code").length },
    { id: "deal", label: "Offres", n: coupons.filter((c) => c.type !== "code").length },
  ];

  const tocItems: { id: string; label: string }[] = [
    { id: "codes", label: "Tous les codes" },
    ...(content ? [{ id: "briefing", label: `Analyse des réductions ${store.name}` }] : []),
    ...(content ? [{ id: "conditions", label: "Conditions d'achat" }] : []),
    ...(content ? [{ id: "checkout", label: "Passer commande" }] : []),
    ...(content ? [{ id: "guide", label: `Le guide ${store.name}` }] : []),
    ...(content ? [{ id: "tips", label: "Astuces" }] : []),
    { id: "leaderboard", label: "Classement des économies" },
    { id: "avis", label: "Avis clients" },
    ...(content ? [{ id: "about", label: `À propos de ${store.name}` }] : []),
  ];

  const storeGrid =
    otherStores.length > 0
      ? Array.from({ length: 40 }, (_, i) => otherStores[i % otherStores.length])
      : [];

  return (
    <div className="glass-stage">
    <div className="mx-auto max-w-shell px-4 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="pt-6 text-[13px] text-ink-soft">
        <Link href="/" className="hover:text-ink">Accueil</Link>
        <span aria-hidden> / </span>
        <Link href="/#categories" className="hover:text-ink">{store.category}</Link>
        <span aria-hidden> / </span>
        <span className="text-ink">{store.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 pb-16 pt-6 lg:grid-cols-[272px_1fr]">
        <aside className="order-2 lg:order-1 lg:sticky lg:top-6 lg:h-fit">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-center rounded-card border border-hair bg-white p-4">
              <StoreLogo name={store.name} size={72} />
            </div>
            <h1 className="mt-4 font-serif text-xl text-ink sm:text-2xl">Codes promo {store.name}</h1>
            <div className="mt-2">
              {rating.count > 0 ? (
                <StarRating value={rating.value} count={rating.count} />
              ) : (
                <span className="text-[13px] text-ink-soft">Pas encore d&apos;avis vérifié</span>
              )}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
              {store.couponCount} codes actifs · {num(store.clicksThisMonth)} visiteurs ce mois-ci ·{" "}
              {store.blurb}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href="#codes"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-orange-600 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(234,88,12,0.75)] transition duration-200 hover:bg-orange-700 active:scale-[0.97]"
              >
                Voir les codes
              </a>
              <StoreClickButton
                store={store}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-hair text-sm font-medium text-ink transition-colors duration-200 hover:bg-surface"
              />
            </div>
          </div>

          <nav aria-label="Sommaire de la page" className="mt-4 glass rounded-2xl p-5">
            <p className="font-serif text-lg text-ink">Sur cette page</p>
            <ul className="mt-3 space-y-2.5">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="flex items-start gap-2 text-[13px] text-orange-700 hover:underline"
                  >
                    <Bookmark size={13} aria-hidden className="mt-0.5 shrink-0" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ReportCodeBox storeName={store.name} className="mt-4" />

          {storeGrid.length > 0 ? (
            <div className="mt-4 glass rounded-2xl p-5">
              <p className="font-serif text-lg text-ink">Autres magasins</p>
              <ul className="mt-3 grid grid-cols-5 gap-2">
                {storeGrid.map((s, i) => (
                  <li key={`${s.slug}-${i}`} className="flex justify-center">
                    <Link
                      href={`/store/${s.slug}/`}
                      title={s.name}
                      aria-label={s.name}
                      className="block rounded-lg transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none"
                    >
                      <StoreIcon store={s} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
      {/* 2. Coupon list */}
      <section id="codes" className="border-t border-hair py-10 first:border-t-0">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrer les offres">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`inline-flex h-9 items-center rounded-full border px-3.5 text-sm transition-colors duration-200 ${
                  active
                    ? "border-orange-600 bg-orange-600 text-white"
                    : "border-white/80 bg-white/60 text-slate-600 backdrop-blur hover:bg-white hover:text-slate-900"
                }`}
              >
                {t.label} <span className="ml-1.5 opacity-70">{t.n}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {filtered.length > 0 ? (
            filtered.map((c) => <CouponCard key={c.id} coupon={c} store={store} />)
          ) : (
            <p className="py-8 text-[15px] text-ink-soft">
              Aucune offre dans cette catégorie aujourd&apos;hui. Les codes sont revérifiés chaque
              semaine.
            </p>
          )}
        </div>
      </section>

      {content ? (
        <>
          {/* 3. Intelligence briefing */}
          <section id="briefing" className="border-t border-hair py-10">
            <button
              type="button"
              onClick={() => setBriefingOpen((v) => !v)}
              aria-expanded={briefingOpen}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="font-serif text-2xl text-ink">
                Analyse des réductions {store.name}
              </span>
              <ChevronDown
                size={20}
                aria-hidden
                className={`shrink-0 text-ink-soft transition-transform duration-200 ${
                  briefingOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {briefingOpen ? (
              <div className="mt-4 max-w-prose">
                <p className="text-[15px] text-ink-soft">{content.intelligenceBriefing.intro}</p>
                <ul className="mt-4 space-y-3">
                  {content.intelligenceBriefing.savingsAnalysis.map((line, i) => (
                    <li key={i} className="flex gap-3 text-[15px] text-ink">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 glass rounded-2xl p-4 text-[15px] text-ink">
                  <span className="text-gold">À savoir : </span>
                  {content.intelligenceBriefing.insider}
                </p>
              </div>
            ) : null}
          </section>

          {/* 4. Purchase policies */}
          <Section id="conditions" title={`Conditions d'achat chez ${store.name}`}>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {content.policies.map((p) => (
                <li key={p.title}>
                  <a
                    href={merchantUrl}
                    target="_blank"
                    rel="sponsored nofollow noopener noreferrer"
                    className="glass glass-interactive relative block h-full overflow-hidden rounded-2xl p-4"
                  >
                    <span className="block font-medium text-ink">{p.title}</span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">
                      {p.note}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          {/* 5. Checkout guide */}
          <Section id="checkout" title="Passer commande avec une réduction">
            <p className="max-w-prose text-[15px] text-ink-soft">{content.checkoutGuide.intro}</p>
            <ol className="mt-4 max-w-prose space-y-3">
              {content.checkoutGuide.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-ink">
                  <span className="font-serif text-lg leading-none text-primary">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* 6. Expert guide */}
          <Section id="guide" title={`Le guide ${store.name}`}>
            <p className="prose-carnet italic">{content.expertGuide.intro}</p>
            {content.expertGuide.sections.map((s) => (
              <div key={s.h2} className="mt-6">
                <h3 className="font-serif text-xl text-ink">{s.h2}</h3>
                <p className="prose-carnet mt-2">{s.body}</p>
              </div>
            ))}
          </Section>

          {/* 7. Pro tips */}
          <Section id="tips" title="Astuces">
            <ul className="max-w-prose space-y-3">
              {content.proTips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-ink">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </Section>
        </>
      ) : null}

      {/* 8. Savings leaderboard */}
      <Section id="leaderboard" title="Classement des économies">
        <p className="text-[15px] text-ink-soft">
          Les offres les plus utilisées via cette page ce mois-ci.
        </p>
        <ol className="mt-4 max-w-prose">
          {leaderboard.map((c, i) => (
            <li
              key={c.id}
              className="flex items-center gap-4 border-t border-hair py-3 first:border-t-0"
            >
              <span className="w-5 font-serif text-lg text-ink-soft">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{c.title}</span>
              <span className="shrink-0 text-sm text-ink-soft">
                {num(c.usedCount)} utilisations
              </span>
            </li>
          ))}
        </ol>
      </Section>

      {/* 9. Customer reviews */}
      <Section id="avis" title="Avis clients">
        <ReviewsBlock storeName={store.name} rating={rating} reviews={reviews} seededCount={seededCount} />
      </Section>

      {/* 10. SEO content block — contained */}
      {content ? (
        <section id="about" className="border-t border-hair py-10">
          <div className="glass rounded-[22px] p-5 sm:p-8">
            <h2 className="font-serif text-2xl text-ink">
              À propos des codes promo {store.name}
            </h2>
            <p className="prose-carnet mt-3">{content.description}</p>
            {content.h2Sections.map((s) => (
              <div key={s.h2} className="mt-6">
                <h3 className="font-serif text-lg text-ink">{s.h2}</h3>
                <p className="prose-carnet mt-2">{s.body}</p>
              </div>
            ))}
            <h3 className="mt-8 font-serif text-lg text-ink">Questions fréquentes</h3>
            <dl className="mt-3 max-w-prose">
              {content.faqs.map((f) => (
                <div key={f.q} className="border-t border-hair py-4 first:border-t-0">
                  <dt className="text-[15px] font-medium text-ink">{f.q}</dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}
        </div>
      </div>
    </div>
    </div>
  );
}

function ReviewsBlock({
  storeName,
  rating,
  reviews,
  seededCount,
}: {
  storeName: string;
  rating: { value: number; count: number };
  reviews: Review[];
  seededCount: number;
}) {
  const [picked, setPicked] = useState(0);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {rating.count > 0 ? (
          <>
            <span className="font-serif text-3xl text-ink">
              {rating.value.toLocaleString("fr-FR")}
            </span>
            <StarRating value={rating.value} showCount={false} />
            <span className="text-sm text-ink-soft">{rating.count} avis vérifiés</span>
          </>
        ) : (
          <span className="text-[15px] text-ink-soft">
            Soyez le premier à donner votre avis sur {storeName}.
          </span>
        )}
      </div>
      {seededCount > 0 ? (
        <p className="mt-1 text-[13px] text-ink-soft">
          {seededCount} avis de démonstration ne sont pas comptés dans la note.
        </p>
      ) : null}

      {/* Star-to-expand submit prompt */}
      <div className="glass mt-5 rounded-2xl p-4">
        {sent ? (
          <p className="text-[15px] text-ink">
            Merci. Votre avis sera publié après une brève vérification.
          </p>
        ) : (
          <>
            <p className="text-[15px] text-ink">Noter {storeName}</p>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label={`Note pour ${storeName}`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={picked === i}
                  aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(0)}
                  onClick={() => setPicked(i)}
                  className="inline-flex h-11 w-11 items-center justify-center"
                >
                  <Star
                    size={22}
                    className={i <= (hover || picked) ? "fill-gold text-gold" : "text-hair"}
                  />
                </button>
              ))}
            </div>

            {picked > 0 ? (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div>
                  <label htmlFor="rv-name" className="sr-only">Votre prénom</label>
                  <input
                    id="rv-name"
                    required
                    placeholder="Votre prénom"
                    className="h-11 w-full max-w-xs rounded-card border border-hair bg-paper px-3 text-base text-ink placeholder:text-ink-soft focus:border-primary focus-visible:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="rv-body" className="sr-only">Votre avis</label>
                  <textarea
                    id="rv-body"
                    required
                    rows={3}
                    placeholder="Le code a-t-il fonctionné ? Sur quel panier ?"
                    className="w-full max-w-prose rounded-card border border-hair bg-paper p-3 text-base text-ink placeholder:text-ink-soft focus:border-primary focus-visible:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-card bg-primary px-4 text-sm font-medium text-primary-ink transition-opacity duration-200 hover:opacity-90"
                >
                  Publier mon avis
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>

      {/* Review cards */}
      {reviews.length > 0 ? (
        <ul className="mt-6 space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="border-t border-hair pt-5 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2">
                <StarRating value={r.rating} showCount={false} />
                <span className="text-sm text-ink">{r.author}</span>
                <span className="text-[13px] text-ink-soft">· {dateFr(r.createdAt)}</span>
              </div>
              <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-ink">{r.body}</p>
              <p className="mt-2 text-[13px] text-ink-soft">
                {num(r.helpful)} personne{r.helpful > 1 ? "s" : ""} ont trouvé cet avis utile
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Compact brand square for the sidebar grid — a wordmark is unreadable at this size. */
function StoreIcon({ store }: { store: Store }) {
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 items-center justify-center rounded-lg text-[13px] font-extrabold shadow-card"
      style={{ backgroundColor: store.brand.bg, color: store.brand.ink }}
    >
      {store.name.slice(0, 2)}
    </span>
  );
}

function ReportCodeBox({ storeName, className = "" }: { storeName: string; className?: string }) {
  const [sent, setSent] = useState(false);

  return (
    <div className={`rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 backdrop-blur-xl ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={18} aria-hidden className="mt-0.5 shrink-0 text-amber-600" />
        <p className="font-serif text-base text-ink">Le code ne fonctionne pas ?</p>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
        Aidez-nous à garder les codes {storeName} à jour.
      </p>
      {sent ? (
        <p className="mt-3 text-[13px] text-ink">Merci, nous vérifions ce code.</p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setSent(true)}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-card bg-orange-600 text-sm font-medium text-white transition-colors duration-200 hover:bg-orange-700"
          >
            Signaler un code
          </button>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-soft">
            <Clock size={13} aria-hidden />
            Le message prend moins d&apos;une minute.
          </p>
        </>
      )}
    </div>
  );
}
