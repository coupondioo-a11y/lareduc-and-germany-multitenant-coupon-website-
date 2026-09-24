import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { createTarget, deleteTarget, toggleTarget } from "./actions";

export default async function AdminAutoAddPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: targets } = await admin
    .from("scrape_targets")
    .select("id, domain, store_page_pattern, is_active")
    .eq("site_id", siteId)
    .order("domain");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-2 text-lg font-semibold">Auto-Add — sites concurrents</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Domaines scannés par <code>agents/index.js</code> (discover → scrape → extract → sync). Le pattern est une
        expression régulière testée sur chaque URL trouvée par Firecrawl pour ne garder que les pages boutique.
      </p>

      <form action={createTarget} className="mb-6 flex flex-wrap gap-2">
        <input name="domain" placeholder="ex: ma-reduc.com" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
        <input
          name="store_page_pattern"
          placeholder="ex: reductions-pour-"
          required
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Ajouter
        </button>
      </form>

      <ul className="divide-y divide-neutral-200">
        {(targets ?? []).map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>
              <span className="font-medium">{t.domain}</span>{" "}
              <span className="text-neutral-400">/{t.store_page_pattern}/</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <form action={toggleTarget}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="is_active" value={String(t.is_active)} />
                <button type="submit" className="text-neutral-600 hover:underline">
                  {t.is_active ? "Désactiver" : "Activer"}
                </button>
              </form>
              <form action={deleteTarget}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Supprimer
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
      {(targets ?? []).length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aucune cible. (Si la table vient d&apos;être créée, la migration 0003 doit être exécutée dans Supabase.)
        </p>
      ) : null}
    </div>
  );
}
