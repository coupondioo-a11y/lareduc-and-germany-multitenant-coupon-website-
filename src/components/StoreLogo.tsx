import { BrandTile } from "./BrandMark";
import type { Store } from "@/lib/types";

const FALLBACK: Store["brand"] = { bg: "#0F172A", ink: "#FFFFFF" };

/** Kept for places that only have a name/brand pair, not a full Store object. */
export function StoreLogo({
  name,
  brand,
  logoUrl,
  size = 48,
}: {
  name: string;
  brand?: Store["brand"];
  logoUrl?: string | null;
  size?: number;
}) {
  return <BrandTile store={{ name, brand: brand ?? FALLBACK, logoUrl }} size={size} />;
}
