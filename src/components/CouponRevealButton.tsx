"use client";

import type { ReactNode } from "react";
import type { Coupon, Store } from "@/lib/fixtures";
import { isExternalUrl, resolveOutboundUrl } from "@/lib/outbound";

/**
 * The signature coupon-site interaction: reveals the code on its own
 * addressable page in a new tab, while sending the current tab to the
 * merchant. See references/store-page-flow.md for the full spec.
 */
export function CouponRevealButton({
  coupon,
  store,
  className,
  children,
}: {
  coupon: Pick<Coupon, "id" | "publicId" | "destinationUrl">;
  store: Pick<Store, "slug" | "affiliateUrl" | "domain">;
  className?: string;
  children: ReactNode;
}) {
  function handleActivate() {
    const revealUrl = `/store/${store.slug}/${coupon.publicId}/`;
    const popup = window.open(revealUrl, `coupon_reveal_${coupon.id}_${Date.now()}`);
    popup?.focus();

    const affiliateUrl = resolveOutboundUrl(coupon, store);
    if (isExternalUrl(affiliateUrl)) {
      window.location.href = affiliateUrl;
    }
  }

  return (
    <button type="button" onClick={handleActivate} className={className}>
      {children}
    </button>
  );
}
