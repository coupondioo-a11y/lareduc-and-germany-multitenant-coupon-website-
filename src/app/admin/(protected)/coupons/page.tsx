import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { deleteCoupon } from "./actions";

export default async function AdminCouponsPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("id, title, type, code, is_active, is_featured, click_count, store:stores(id, name)")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Codes promo</h1>
        <Link href="/admin/coupons/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Nouveau code
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Titre</th>
            <th>Boutique</th>
            <th>Type</th>
            <th>Actif</th>
            <th>Clics</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(coupons ?? []).map((c) => {
            const store = Array.isArray(c.store) ? c.store[0] : c.store;
            return (
              <tr key={c.id} className="border-b">
                <td className="py-2">
                  <Link href={`/admin/coupons/${c.id}`} className="text-orange-700 hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td>{store?.name ?? "—"}</td>
                <td>{c.type}</td>
                <td>{c.is_active ? "oui" : "non"}</td>
                <td>{c.click_count}</td>
                <td>
                  <form action={deleteCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="store_id" value={store?.id ?? ""} />
                    <button type="submit" className="text-red-600 hover:underline">
                      Supprimer
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(coupons ?? []).length === 0 ? <p className="mt-4 text-sm text-neutral-500">Aucun code pour ce site.</p> : null}
    </div>
  );
}
