import Image from "next/image";
import type { Store } from "@/lib/types";

/**
 * Real logo (Logo Manager, <=760px WebP) when the store has one; otherwise
 * a wordmark on its generated brand colour as a placeholder.
 */

export function BrandTile({
  store,
  size = 56,
  width,
  height,
  className = "",
}: {
  store: Pick<Store, "name" | "brand" | "logoUrl">;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}) {
  const w = width ?? size;
  const h = height ?? size;

  if (store.logoUrl) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-card bg-white shadow-card ${className}`}
        style={{ width: w, height: h }}
      >
        <Image src={store.logoUrl} alt="" width={w} height={h} className="h-full w-full object-contain p-1" unoptimized />
      </span>
    );
  }

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
