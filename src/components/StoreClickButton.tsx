"use client";

import { ExternalLink } from "lucide-react";
import type { Store } from "@/lib/types";
import { trackStoreClick } from "@/app/actions/track";

/**
 * The store header's "visit store" button. Not part of the reveal flow —
 * no interstitial, no code. Just increments the store's click count and
 * opens the affiliate link.
 */
export function StoreClickButton({
  store,
  className,
}: {
  store: Pick<Store, "id" | "name" | "affiliateUrl">;
  className?: string;
}) {
  function handleClick() {
    window.open(store.affiliateUrl, "_blank", "noopener");
    if (store.id) void trackStoreClick(store.id);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      <ExternalLink size={15} aria-hidden />
      Visiter {store.name}
    </button>
  );
}
