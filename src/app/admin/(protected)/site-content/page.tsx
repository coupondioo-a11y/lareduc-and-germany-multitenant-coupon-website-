import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { createBanner, createHeroSlide, deleteBanner, deleteHeroSlide, saveSiteStats } from "./actions";

export default async function AdminSiteContentPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  const [{ data: stores }, { data: slides }, { data: banners }, { data: stats }] = await Promise.all([
    admin.from("stores").select("id, name").eq("site_id", siteId).order("name"),
    admin.from("hero_slides").select("id, headline, figure, is_active").eq("site_id", siteId).order("position"),
    admin.from("sidebar_banners").select("id, alt, is_active").eq("site_id", siteId).order("position"),
    admin
      .from("site_stats")
      .select("codes_used_label, codes_used_note, saved_label, saved_note, verified_label, verified_note")
      .eq("site_id", siteId)
      .maybeSingle(),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section>
        <h1 className="mb-4 text-lg font-semibold">Contenu du site</h1>
        <h2 className="mb-2 font-medium">Bandeau d&apos;accueil (hero slides)</h2>
        <form action={createHeroSlide} className="mb-4 flex flex-wrap gap-2">
          <select name="store_id" required className="rounded border border-neutral-300 px-2 py-1.5 text-sm">
            <option value="">Boutique</option>
            {(stores ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input name="headline" placeholder="Titre" required className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <input name="figure" placeholder="Chiffre (-50 %)" className="w-28 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <input name="cta_label" placeholder="Bouton" className="w-32 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <input name="from_color" placeholder="#FF8A3D" className="w-24 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <input name="to_color" placeholder="#FFC46B" className="w-24 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <button type="submit" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
            Ajouter
          </button>
        </form>
        <ul className="divide-y divide-neutral-200 text-sm">
          {(slides ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between py-2">
              <span>{s.headline} {s.figure ? `(${s.figure})` : ""}</span>
              <form action={deleteHeroSlide}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Bannières latérales</h2>
        <form action={createBanner} className="mb-4 flex flex-wrap gap-2">
          <select name="store_id" className="rounded border border-neutral-300 px-2 py-1.5 text-sm">
            <option value="">(aucune boutique)</option>
            {(stores ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input name="image_url" placeholder="URL image" required className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <input name="href" placeholder="Lien" className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <input name="alt" placeholder="Texte alternatif" className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm" />
          <button type="submit" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
            Ajouter
          </button>
        </form>
        <ul className="divide-y divide-neutral-200 text-sm">
          {(banners ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between py-2">
              <span>{b.alt ?? "(sans texte alternatif)"}</span>
              <form action={deleteBanner}>
                <input type="hidden" name="id" value={b.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Chiffres clés (bandeau de stats)</h2>
        <form action={saveSiteStats} className="flex flex-col gap-2">
          {[
            ["codes_used_label", "Chiffre (ex: 12 millions)", stats?.codes_used_label],
            ["codes_used_note", "Texte", stats?.codes_used_note],
            ["saved_label", "Chiffre économies", stats?.saved_label],
            ["saved_note", "Texte économies", stats?.saved_note],
            ["verified_label", "Chiffre vérifiés", stats?.verified_label],
            ["verified_note", "Texte vérifiés", stats?.verified_note],
          ].map(([name, placeholder, value]) => (
            <input
              key={name}
              name={name as string}
              placeholder={placeholder as string}
              defaultValue={(value as string) ?? ""}
              className="rounded border border-neutral-300 px-3 py-2 text-sm"
            />
          ))}
          <button type="submit" className="mt-2 w-fit rounded bg-neutral-900 px-3 py-2 text-sm text-white">
            Enregistrer
          </button>
        </form>
      </section>
    </div>
  );
}
