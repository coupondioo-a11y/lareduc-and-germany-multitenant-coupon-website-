import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { resolveFlag } from "./actions";

export default async function AdminFlaggedPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: flags } = await admin
    .from("flagged_coupons")
    .select("id, reason, status, created_at, coupon:coupons(id, title, is_active, store:stores(name))")
    .eq("site_id", siteId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Codes signalés</h1>
      <ul className="flex flex-col gap-3">
        {(flags ?? []).map((f) => {
          const coupon = Array.isArray(f.coupon) ? f.coupon[0] : f.coupon;
          const store = coupon ? (Array.isArray(coupon.store) ? coupon.store[0] : coupon.store) : null;
          return (
            <li key={f.id} className="rounded border border-neutral-200 p-4 text-sm">
              <p className="font-medium">
                {store?.name} — {coupon?.title}
              </p>
              <p className="mt-1 text-neutral-500">{f.reason}</p>
              <form action={resolveFlag} className="mt-3 flex items-center gap-3">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="coupon_id" value={coupon?.id ?? ""} />
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" name="deactivate_coupon" />
                  Désactiver le code
                </label>
                <button type="submit" name="status" value="resolved" className="rounded bg-neutral-900 px-3 py-1.5 text-white">
                  Résoudre
                </button>
                <button type="submit" name="status" value="dismissed" className="rounded border border-neutral-300 px-3 py-1.5">
                  Rejeter
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      {(flags ?? []).length === 0 ? <p className="text-sm text-neutral-500">Aucun signalement en attente.</p> : null}
    </div>
  );
}
