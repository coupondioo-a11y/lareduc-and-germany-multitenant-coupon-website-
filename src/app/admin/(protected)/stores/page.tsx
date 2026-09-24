import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { deleteStore } from "./actions";

export default async function AdminStoresPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: stores } = await admin
    .from("stores")
    .select("id, name, slug, is_active, is_featured, coupon_count, content_status")
    .eq("site_id", siteId)
    .order("name");

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Boutiques</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Nom</th>
            <th>Codes</th>
            <th>Contenu</th>
            <th>Actif</th>
            <th>Mis en avant</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(stores ?? []).map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-2">
                <Link href={`/admin/stores/${s.id}`} className="text-orange-700 hover:underline">
                  {s.name}
                </Link>
              </td>
              <td>{s.coupon_count}</td>
              <td>{s.content_status}</td>
              <td>{s.is_active ? "oui" : "non"}</td>
              <td>{s.is_featured ? "oui" : "non"}</td>
              <td>
                <form action={deleteStore}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-red-600 hover:underline">
                    Supprimer
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(stores ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          Aucune boutique pour ce site. Lancez le scraper (agents/) ou attendez la synchronisation réseau.
        </p>
      ) : null}
    </div>
  );
}
