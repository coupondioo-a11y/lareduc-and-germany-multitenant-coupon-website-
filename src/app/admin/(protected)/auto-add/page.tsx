import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { createTarget, deleteTarget, toggleTarget } from "./actions";
import { AddStoreForm } from "./AddStoreForm";

export default async function AdminAutoAddPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const [{ data: targets }, { data: site }] = await Promise.all([
    admin
      .from("scrape_targets")
      .select("id, domain, is_active")
      .eq("site_id", siteId)
      .order("domain"),
    admin.from("sites").select("country_code, language").eq("id", siteId).single(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold">Auto-Add</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Site actif : {site?.country_code} ({site?.language}). Tout le contenu est rédigé dans la langue du site.
      </p>

      <section className="mb-10">
        <h2 className="mb-2 font-medium">Ajouter une boutique automatiquement</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Entrez le domaine de la boutique. Le système trouve sa page de codes chez un concurrent, en extrait
          toutes les offres et codes, DeepSeek les reformule dans un style original, lit aussi le site
          officiel de la marque, puis rédige le contenu SEO complet de la page boutique.
        </p>
        <AddStoreForm />
      </section>

      <section>
        <h2 className="mb-1 font-medium">Sites concurrents (sources de recherche)</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Domaines de sites de codes promo où chercher les offres d&apos;une boutique. Le domaine seul suffit
          (par ex. bravopromo.fr). Ne mettez pas ici le site d&apos;une boutique.
        </p>

        <form action={createTarget} className="mb-4 flex gap-2">
          <input
            name="domain"
            placeholder="bravopromo.fr"
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
              <span className={t.is_active ? "" : "text-neutral-500 line-through"}>{t.domain}</span>
              <span className="flex shrink-0 items-center gap-3">
                <form action={toggleTarget}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="is_active" value={String(t.is_active)} />
                  <button type="submit" className="text-neutral-500 hover:underline">
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
            Aucun site configuré. Par défaut (FR) : bravopromo.fr et ma-reduc.com, puis une recherche web.
          </p>
        ) : null}
      </section>
    </div>
  );
}
