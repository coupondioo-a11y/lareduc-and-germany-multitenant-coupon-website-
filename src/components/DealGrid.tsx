import { CouponCard } from "./CouponCard";
import type { Coupon, Store } from "@/lib/types";

export function DealGrid({ items }: { items: { coupon: Coupon; store: Store }[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map(({ coupon, store }) => (
        <li key={coupon.id}>
          <CouponCard coupon={coupon} store={store} variant="tile" />
        </li>
      ))}
    </ul>
  );
}
