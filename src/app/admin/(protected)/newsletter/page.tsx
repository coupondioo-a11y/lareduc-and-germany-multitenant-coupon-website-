import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

export default async function AdminNewsletterPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: subscribers, count } = await admin
    .from("newsletter_subscribers")
    .select("email, is_active, source_store_slug, subscribed_at", { count: "exact" })
    .eq("site_id", siteId)
    .order("subscribed_at", { ascending: false });

  const csv = ["email,actif,source,inscrit_le", ...(subscribers ?? []).map((s) =>
    [s.email, s.is_active, s.source_store_slug ?? "", s.subscribed_at].join(",")
  )].join("\n");

  return (
    <div>
      <h1 className="mb-2 text-lg font-semibold">Newsletter</h1>
      <p className="mb-4 text-sm text-neutral-500">
        {count ?? 0} inscrit(s). Aucun fournisseur d&apos;e-mail n&apos;est configuré dans ce projet -- cette
        page liste et exporte les abonnés, l&apos;envoi de campagnes nécessite d&apos;intégrer un service
        (Resend, Postmark, etc.) non prévu dans la stack actuelle.
      </p>
      <a
        href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
        download="newsletter.csv"
        className="mb-4 inline-block rounded bg-neutral-900 px-3 py-1.5 text-sm text-white"
      >
        Exporter en CSV
      </a>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2">Email</th>
            <th>Actif</th>
            <th>Source</th>
            <th>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {(subscribers ?? []).map((s) => (
            <tr key={s.email} className="border-b">
              <td className="py-2">{s.email}</td>
              <td>{s.is_active ? "oui" : "non"}</td>
              <td>{s.source_store_slug ?? "—"}</td>
              <td>{new Date(s.subscribed_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
