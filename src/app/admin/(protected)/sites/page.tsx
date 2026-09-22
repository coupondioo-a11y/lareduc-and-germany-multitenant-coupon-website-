import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminSitesPage() {
  const admin = createAdminClient();
  const { data: sites } = await admin
    .from("sites")
    .select("id, country_code, primary_domain, brand_name, language, is_active")
    .order("country_code");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Sites</h1>
        <Link href="/admin/sites/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Add country
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Country</th>
            <th>Brand</th>
            <th>Domain</th>
            <th>Language</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {(sites ?? []).map((s) => (
            <tr key={s.id} className="border-b">
              <td className="py-2">{s.country_code}</td>
              <td>{s.brand_name}</td>
              <td>{s.primary_domain}</td>
              <td>{s.language}</td>
              <td>{s.is_active ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
