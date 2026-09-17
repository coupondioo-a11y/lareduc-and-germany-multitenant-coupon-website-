import { BrandTile } from "./BrandMark";
import { stores, type Store } from "@/lib/fixtures";

const FALLBACK: Store["brand"] = { bg: "#0F172A", ink: "#FFFFFF" };

/**
 * Kept for the store page, which addresses stores by display name.
 * Delegates to the shared BrandTile so there is one logo treatment.
 */
export function StoreLogo({ name, size = 48 }: { name: string; size?: number }) {
  const match = stores.find((s) => s.name === name);
  return <BrandTile store={{ name, brand: match?.brand ?? FALLBACK }} size={size} />;
}
