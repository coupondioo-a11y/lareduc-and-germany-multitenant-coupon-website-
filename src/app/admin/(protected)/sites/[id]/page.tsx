import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteSite, updateSiteVerification } from "../../actions";
import { ErrorBanner } from "../../ErrorBanner";

export default async function SiteSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const admin = createAdminClient();
  const { data: site } = await admin
    .from("sites")
    .select("id, country_code, brand_name, primary_domain, ga_measurement_id, gsc_verification")
    .eq("id", id)
    .maybeSingle();

  if (!site) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">
        {site.brand_name} ({site.country_code})
      </h1>
      <ErrorBanner code={error} />

      <section className="mb-8">
        <h2 className="mb-2 font-medium">Vérifications</h2>
        <form action={updateSiteVerification} className="flex flex-col gap-3">
          <input type="hidden" name="siteId" value={site.id} />
          <label className="flex flex-col gap-1 text-sm">
            ID de mesure Google Analytics (GA4 / gtag)
            <input
              name="ga_measurement_id"
              defaultValue={site.ga_measurement_id ?? ""}
              placeholder="G-XXXXXXXXXX"
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Code de vérification Google Search Console
            <input
              name="gsc_verification"
              defaultValue={site.gsc_verification ?? ""}
              placeholder="contenu de la balise meta google-site-verification"
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
          <button type="submit" className="mt-2 w-fit rounded bg-neutral-900 px-3 py-2 text-sm text-white">
            Enregistrer
          </button>
        </form>
      </section>

      <section className="rounded border border-red-200 bg-red-50 p-4">
        <h2 className="mb-2 font-medium text-red-900">Supprimer ce site</h2>
        <p className="mb-3 text-sm text-red-800">
          Supprime définitivement {site.primary_domain} et toutes ses boutiques, codes, avis et contenus.
          Cette action est irréversible. Tapez <strong>{site.country_code}</strong> pour confirmer.
        </p>
        <form action={deleteSite} className="flex gap-2">
          <input type="hidden" name="siteId" value={site.id} />
          <input
            name="confirmCode"
            placeholder={site.country_code}
            required
            className="rounded border border-red-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-red-700 px-3 py-2 text-sm text-white">
            Supprimer le site
          </button>
        </form>
      </section>
    </div>
  );
}
