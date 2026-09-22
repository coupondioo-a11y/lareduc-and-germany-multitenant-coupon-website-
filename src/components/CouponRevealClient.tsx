"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, CheckCircle2, Copy, X } from "lucide-react";
import { Newsletter } from "./Newsletter";
import { StoreLogo } from "./StoreLogo";
import type { Coupon, Store } from "@/lib/types";
import { dateFr } from "@/lib/format";
import { resolveOutboundUrl } from "@/lib/outbound";
import { trackCouponClick } from "@/app/actions/track";

/**
 * Variant A of the reveal popup — a real, addressable page rendered as a
 * full-page modal over blurred store-page context. See
 * references/store-page-flow.md section 3.
 */
export function CouponRevealClient({
  store,
  coupon,
  similar,
}: {
  store: Store;
  coupon: Coupon;
  similar: Store[];
}) {
  const [copied, setCopied] = useState(false);
  const hasCode = coupon.type === "code" && !!coupon.code;
  const affiliateUrl = resolveOutboundUrl(coupon, store);

  function openAffiliate() {
    window.open(affiliateUrl, "_blank", "noopener,noreferrer");
    if (store.id) void trackCouponClick(coupon.id, store.id);
  }

  function copyAndGo() {
    if (!coupon.code) return;
    navigator.clipboard
      .writeText(coupon.code)
      .then(() => {
        setCopied(true);
        setTimeout(openAffiliate, 900);
      })
      .catch(openAffiliate);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <iframe
        src={`/store/${store.slug}/`}
        aria-hidden="true"
        tabIndex={-1}
        title=""
        className="pointer-events-none absolute inset-0 h-full w-full scale-105 opacity-60 blur-md"
      />

      <div className="relative mx-auto flex min-h-full max-w-lg flex-col px-4 py-8 sm:py-14">
        <div className="overflow-hidden rounded-panel bg-paper shadow-lift">
          <div className="flex items-center gap-2 bg-emerald-600 px-5 py-3 text-[13px] font-medium text-white">
            <CheckCircle2 size={16} aria-hidden className="shrink-0" />
            La boutique {store.name} s&apos;est ouverte dans l&apos;onglet précédent
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <StoreLogo name={store.name} brand={store.brand} size={56} />
              <Link
                href={`/store/${store.slug}/`}
                aria-label="Fermer"
                className="rounded-full p-1.5 text-ink-soft transition-colors duration-200 hover:bg-surface hover:text-ink"
              >
                <X size={20} aria-hidden />
              </Link>
            </div>

            <p className="mt-4 font-serif text-3xl leading-none text-primary">
              {coupon.discountValue ?? (coupon.type === "free_shipping" ? "Port" : "Offre")}
            </p>
            <h1 className="mt-2 text-lg font-medium leading-snug text-ink">{coupon.title}</h1>
            {coupon.expiryDate ? (
              <p className="mt-1 text-[13px] text-ink-soft">Expire le {dateFr(coupon.expiryDate)}</p>
            ) : null}

            {hasCode ? (
              <div className="mt-6">
                <span className="flex w-full items-center justify-center rounded-card border-2 border-dashed border-orange-600 bg-surface px-4 py-3 font-mono text-xl tracking-wider text-ink">
                  {coupon.code}
                </span>
                <button
                  type="button"
                  onClick={copyAndGo}
                  className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-card bg-orange-600 text-base font-medium text-white transition-colors duration-200 hover:bg-orange-700"
                >
                  {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                  {copied ? "Copié !" : "Copier & Aller à la boutique"}
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-ink-soft">Aucun code requis</p>
                <button
                  type="button"
                  onClick={openAffiliate}
                  className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-card bg-orange-600 text-base font-medium text-white transition-colors duration-200 hover:bg-orange-700"
                >
                  Voir l&apos;offre sur {store.name}
                </button>
              </div>
            )}
          </div>

          <div className="bg-hero px-6 py-6 text-white sm:px-8">
            <p className="text-sm font-semibold">Recevoir les meilleurs codes</p>
            <div className="mt-3">
              <Newsletter />
            </div>
          </div>

          {similar.length > 0 ? (
            <div className="border-t border-hair p-6 sm:p-8">
              <p className="text-sm font-medium text-ink">Magasins similaires</p>
              <ul className="mt-3 flex gap-3 overflow-x-auto">
                {similar.map((s) => (
                  <li key={s.slug} className="shrink-0">
                    <Link
                      href={`/store/${s.slug}/`}
                      className="flex w-20 flex-col items-center gap-1.5 rounded-card border border-hair p-3 text-center transition-colors duration-200 hover:bg-surface"
                    >
                      <StoreLogo name={s.name} brand={s.brand} size={40} />
                      <span className="truncate text-[12px] text-ink-soft">{s.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
