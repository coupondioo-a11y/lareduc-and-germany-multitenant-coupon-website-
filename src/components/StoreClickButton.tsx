"use client";

import { ExternalLink } from "lucide-react";
import type { Store } from "@/lib/fixtures";

/**
 * The store header's "visit store" button. Not part of the reveal flow —
 * no interstitial, no code. Just increments the store's click count and
 * opens the affiliate link.
 */
export function StoreClickButton({
  store,
  className,
}: {
  store: Pick<Store, "name" | "affiliateUrl">;
  className?: string;
}) {
  function handleClick() {
    // Preview only — the real handler increments stores.click_count via
    // the admin (service-role) client before opening the affiliate link.
    window.open(store.affiliateUrl, "_blank", "noopener");
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      <ExternalLink size={15} aria-hidden />
      Visiter {store.name}
    </button>
  );
}
