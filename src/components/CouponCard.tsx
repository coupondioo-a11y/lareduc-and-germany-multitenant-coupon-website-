"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowUpRight, ChevronDown, ShieldCheck, Tag } from "lucide-react";
import { BrandTile } from "./BrandMark";
import { CouponRevealButton } from "./CouponRevealButton";
import type { Coupon, Store } from "@/lib/fixtures";
import { dateFr, dateFrShort, maskCode, num } from "@/lib/format";

type CardStore = Pick<Store, "slug" | "name" | "domain" | "affiliateUrl" | "brand">;

export function CouponCard({
  coupon,
  store,
  variant = "row",
}: {
  coupon: Coupon;
  store: CardStore;
  variant?: "row" | "tile";
}) {
  const hasCode = coupon.type === "code" && !!coupon.code;
  const value = coupon.discountValue ?? (coupon.type === "free_shipping" ? "Port offert" : "Offre");
  const label = hasCode ? "Code" : coupon.type === "free_shipping" ? "Livraison" : "Offre";

  if (variant === "tile") {
    return (
      <article className="glass glass-interactive group/card relative flex h-full flex-col overflow-hidden rounded-[20px] p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/store/${store.slug}/`} aria-label={`Codes promo ${store.name}`} className="shrink-0 rounded-xl">
            <BrandTile store={store} width={88} height={52} className="border border-slate-200/80 shadow-none" />
          </Link>
          <ValueTile value={value} label={label} compact />
        </div>

        <Badges coupon={coupon} className="mt-3" />
        <Link
          href={`/store/${store.slug}/`}
          className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-slate-900"
        >
          {store.name}
        </Link>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] text-slate-900">
          {coupon.title}
        </h3>

        <div className="mt-auto pt-4">
          <RevealCta coupon={coupon} store={store} hasCode={hasCode} compact />
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-900/[0.08] pt-2.5 text-[11.5px] font-medium text-slate-500">
            <span>{coupon.expiryDate ? `Exp. ${dateFrShort(coupon.expiryDate)}` : "Sans date limite"}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <ShieldCheck size={12} aria-hidden />
              {num(coupon.usedCount)} utilisations
            </span>
          </div>
        </div>
      </article>
    );
  }

  return <CouponRowCard coupon={coupon} store={store} hasCode={hasCode} value={value} label={label} />;
}

function CouponRowCard({
  coupon,
  store,
  hasCode,
  value,
  label,
}: {
  coupon: Coupon;
  store: CardStore;
  hasCode: boolean;
  value: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <article className="glass glass-interactive group/card relative overflow-hidden rounded-[22px] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
          <ValueTile value={value} label={label} />
          <div className="min-w-0">
            <Badges coupon={coupon} />
            <h3 className="mt-2 text-[16px] font-bold leading-snug tracking-[-0.01em] text-slate-900 sm:text-[18px]">
              {coupon.title}
            </h3>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
          <RevealCta coupon={coupon} store={store} hasCode={hasCode} />
          <p className="text-center text-[12.5px] font-medium text-slate-500 sm:text-right">
            {coupon.expiryDate ? `Expire : ${dateFr(coupon.expiryDate)}` : "Sans date limite"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-900/[0.08] pt-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className={`inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-semibold transition-colors duration-200 active:scale-[0.97] ${
            open
              ? "border-orange-200 bg-orange-50 text-orange-700"
              : "border-white/80 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900"
          }`}
        >
          Conditions
          <ChevronDown
            size={14}
            aria-hidden
            className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
          <ShieldCheck size={13} aria-hidden />
          Utilisé {num(coupon.usedCount)} fois
        </span>
      </div>

      {/* grid-rows 0fr→1fr expands to the content's real height without measuring it */}
      <div
        id={panelId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-1 pt-3 text-[13px] leading-relaxed text-slate-600">
            <li>Vérifié par notre équipe le {dateFr(coupon.verifiedAt)}.</li>
            {coupon.minAmount ? <li>Condition d&apos;achat : {coupon.minAmount}.</li> : null}
            {coupon.isExclusive ? <li>Offre exclusive, disponible uniquement ici.</li> : null}
            <li>
              {hasCode
                ? `Copiez le code à l'étape suivante et collez-le au paiement chez ${store.name}.`
                : "Aucun code nécessaire : la réduction s'applique automatiquement."}
            </li>
          </ul>
        </div>
      </div>
    </article>
  );
}

// Solid, never glass: a translucent layer on a translucent card loses legibility.
function ValueTile({ value, label, compact = false }: { value: string; label: string; compact?: boolean }) {
  const long = value.length > 6;
  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white px-1 text-center ${
        compact ? "h-[52px] w-[64px]" : "h-20 w-20 sm:h-24 sm:w-24"
      }`}
    >
      <span
        className={`block font-extrabold leading-none tracking-[-0.03em] text-orange-600 transition duration-300 group-hover/card:scale-110 group-hover/card:drop-shadow-[0_0_14px_rgba(234,88,12,0.45)] motion-reduce:group-hover/card:scale-100 ${
          long ? "text-[12px] leading-tight" : compact ? "text-[17px]" : "text-[22px] sm:text-[26px]"
        }`}
      >
        {value}
      </span>
      <span className={`font-bold uppercase tracking-[0.18em] text-slate-500 ${compact ? "mt-1 text-[8px]" : "mt-1.5 text-[9.5px]"}`}>
        {label}
      </span>
    </div>
  );
}

function Badges({ coupon, className = "" }: { coupon: Coupon; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      <span
        title={`Vérifié le ${dateFr(coupon.verifiedAt)}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Vérifié
      </span>
      {coupon.isExclusive ? (
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-[12px] font-semibold text-orange-700">
          Exclusif
        </span>
      ) : null}
    </div>
  );
}

function RevealCta({
  coupon,
  store,
  hasCode,
  compact = false,
}: {
  coupon: Coupon;
  store: CardStore;
  hasCode: boolean;
  compact?: boolean;
}) {
  const body = `bg-orange-600 font-bold uppercase text-white shadow-[0_8px_20px_-8px_rgba(234,88,12,0.75)] transition-colors duration-200 group-hover/btn:bg-orange-700 ${
    compact ? "text-[12px] tracking-[0.04em]" : "text-[13px] tracking-[0.06em]"
  }`;

  return (
    <CouponRevealButton
      coupon={coupon}
      store={store}
      // Press feedback lands on pointer-down, not on release.
      className={`group/btn block w-full appearance-none rounded-xl border-0 bg-transparent p-0 ${
        hasCode ? "" : "transition-transform duration-100 ease-out active:scale-[0.97] motion-reduce:active:scale-100"
      } ${compact ? "" : "sm:w-auto sm:min-w-[14rem]"}`}
    >
      {hasCode ? (
        <span className="relative flex h-11 w-full items-stretch overflow-hidden rounded-card border-2 border-dashed border-orange-600">
          {/* Fill sweeps in from the code chip on the right as you hover, hinting there's more behind it. */}
          <span
            aria-hidden
            className={`absolute inset-0 bg-orange-600 transition-transform duration-300 ease-out motion-reduce:transition-none group-hover/btn:translate-x-0 ${
              compact ? "translate-x-[calc(100%-3rem)]" : "translate-x-[calc(100%-4rem)]"
            }`}
          />
          <span
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 text-sm font-semibold text-orange-700 transition-colors duration-300 motion-reduce:transition-none group-hover/btn:text-white ${
              compact ? "pl-3 pr-2" : "pl-4 pr-3"
            }`}
          >
            <Tag size={15} aria-hidden />
            Code promo
          </span>
          <span
            className={`relative z-10 flex shrink-0 items-center justify-center font-mono text-xs text-white ${
              compact ? "w-12" : "w-16"
            }`}
          >
            {maskCode(coupon.code as string)}
          </span>
        </span>
      ) : (
        <span className={`flex h-11 items-center justify-center gap-2 rounded-xl px-5 ${body}`}>
          Voir l&apos;offre
          <ArrowUpRight
            size={15}
            aria-hidden
            className="transition-transform duration-300 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5"
          />
        </span>
      )}
    </CouponRevealButton>
  );
}
