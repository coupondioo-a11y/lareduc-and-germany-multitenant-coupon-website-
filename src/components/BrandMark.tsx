import type { Store } from "@/lib/fixtures";

/**
 * Stand-in for a real store logo. The Logo Manager will later serve a
 * <=760px WebP through the CDN helper; until then each store renders as
 * its wordmark on its brand colour.
 */

export function BrandTile({
  store,
  size = 56,
  width,
  height,
  className = "",
}: {
  store: Pick<Store, "name" | "brand">;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-card bg-white px-2 text-center font-bold leading-tight tracking-tight shadow-card ${className}`}
      style={{ width: w, height: h, color: store.brand.bg, fontSize: Math.max(10, Math.min(w, h) * 0.19) }}
    >
      {store.name}
    </span>
  );
}

export function BrandBlock({
  store,
  className = "",
}: {
  store: Pick<Store, "name" | "brand">;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center px-4 text-center text-lg font-extrabold uppercase leading-tight tracking-tight ${className}`}
      style={{ backgroundColor: store.brand.bg, color: store.brand.ink }}
    >
      {store.name}
    </span>
  );
}
