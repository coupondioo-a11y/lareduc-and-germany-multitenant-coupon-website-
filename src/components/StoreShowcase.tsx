import Link from "next/link";
import { BrandTile } from "./BrandMark";
import { Rail } from "./Rail";
import type { Coupon, Store } from "@/lib/types";

export function StoreShowcase({ items }: { items: { coupon: Coupon; store: Store }[] }) {
  return (
    <Rail label="Codes promo populaires">
      {items.map(({ coupon: c, store }) => (
        <Link
          key={c.id}
          href={`/store/${store.slug}/`}
          className="group relative w-[280px] shrink-0 overflow-hidden rounded-card sm:w-[320px]"
        >
          <div
            className="h-[230px] w-full"
            style={{ background: `linear-gradient(150deg, ${store.brand.bg} 0%, rgba(0,0,0,.75) 100%)` }}
          />
          {c.isExclusive ? (
            <span className="absolute left-0 top-0 bg-sienna px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              Exclusif
            </span>
          ) : null}
          <BrandTile store={store} width={104} height={64} className="absolute left-4 top-11" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12">
            <p className="text-[15px] font-bold text-white">{store.name}</p>
            <p className="mt-0.5 line-clamp-1 text-[13px] text-white/85">{c.title}</p>
          </div>
        </Link>
      ))}
    </Rail>
  );
}
