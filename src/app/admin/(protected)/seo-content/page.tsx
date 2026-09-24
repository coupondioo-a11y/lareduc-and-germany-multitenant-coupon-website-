import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

export default async function AdminSeoContentPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: stores } = await admin
    .from("stores")
    .select("id, name, content_status, content_generated_at")
    .eq("site_id", siteId)
    .order("name");

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Contenu SEO</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Boutique</th>
            <th>Statut</th>
            <th>Généré le</th>
          </tr>
        </thead>
        <tbody>
          {(stores ?? []).map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-2">
                <Link href={`/admin/seo-content/${s.id}`} className="text-orange-700 hover:underline">
                  {s.name}
                </Link>
              </td>
              <td>{s.content_status}</td>
              <td>{s.content_generated_at ? new Date(s.content_generated_at).toLocaleDateString("fr-FR") : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
