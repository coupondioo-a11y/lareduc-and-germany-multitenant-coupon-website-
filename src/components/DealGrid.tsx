import { CouponCard } from "./CouponCard";
import { cardStore, couponById, getStore } from "@/lib/fixtures";

export function DealGrid({ couponIds }: { couponIds: string[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {couponIds.map((id) => {
        const c = couponById(id);
        return (
          <li key={id}>
            <CouponCard coupon={c} store={cardStore(getStore(c.storeSlug)!)} variant="tile" />
          </li>
        );
      })}
    </ul>
  );
}
