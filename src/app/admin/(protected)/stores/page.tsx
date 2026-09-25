import Link from "next/link";
import { CalendarPlus, ExternalLink, Pencil, RefreshCw, Search, Sparkles, Trash2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { brandColorFor } from "@/lib/brand-color";
import { ActionButton, ToggleSwitch } from "../controls";
import { Pagination, PAGE_SIZE, cleanQuery } from "../Pagination";
import { deleteStoreAction, generateContentAction, refreshOffersAction, setStoreEvents } from "../row-actions";

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const page = Math.max(1, Number(sp.page) || 1);

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  let query = admin
    .from("stores")
    .select("id, name, slug, logo_url, coupon_count, is_active, is_featured, show_on_daily, show_on_weekly, content_status", {
      count: "exact",
    })
    .eq("site_id", siteId)
    .order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);

  const [{ data: stores, count }, { data: site }, { data: events }] = await Promise.all([
    query,
    admin.from("sites").select("country_code, site_url").eq("id", siteId).single(),
    admin.from("events").select("id, name").eq("site_id", siteId).order("position"),
  ]);

  const ids = (stores ?? []).map((s) => s.id);
  const { data: assigned } = ids.length
    ? await admin.from("event_stores").select("store_id, event_id").in("store_id", ids)
    : { data: [] as { store_id: string; event_id: string }[] };
  const eventsByStore = new Map<string, Set<string>>();
  for (const a of assigned ?? []) {
    if (!eventsByStore.has(a.store_id)) eventsByStore.set(a.store_id, new Set());
    eventsByStore.get(a.store_id)!.add(a.event_id);
  }

  // Locally the storefront resolves the tenant from ?__site=; in production from its own domain.
  const storefront = (slug: string) =>
    process.env.NODE_ENV !== "production"
      ? `/store/${slug}/?__site=${site?.country_code}`
      : `${site?.site_url}/store/${slug}/`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Boutiques</h1>
        <div className="flex gap-2">
          <Link href="/admin/auto-add" className="rounded border border-neutral-300 px-3 py-1.5 text-sm">
            Auto-Add
          </Link>
          <Link href="/admin/stores/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm">
            + Ajouter
          </Link>
        </div>
      </div>

      <form className="relative mb-2">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher une boutique…"
          className="w-full rounded border border-neutral-300 py-2 pl-9 pr-3"
        />
      </form>
      <p className="mb-3 text-xs text-neutral-500">
        {count ?? 0} boutique(s){q ? ` pour « ${q} »` : ""}
      </p>

      <div className="overflow-x-auto rounded border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-3 py-2.5">Logo</th>
              <th>Nom</th>
              <th>Slug</th>
              <th className="text-center">Codes</th>
              <th className="text-center">Vedette</th>
              <th className="text-center">Jour</th>
              <th className="text-center">Semaine</th>
              <th className="text-center">Actif</th>
              <th className="pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(stores ?? []).map((s) => {
              const tint = brandColorFor(s.name).bg;
              const mine = eventsByStore.get(s.id);
              return (
                <tr key={s.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2">
                    {s.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.logo_url} alt="" className="h-9 w-9 rounded bg-white object-contain p-0.5" />
                    ) : (
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded text-xs font-bold text-white"
                        style={{ background: tint }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="font-medium text-white">
                    <Link href={`/admin/stores/${s.id}`} className="hover:underline">
                      {s.name}
                    </Link>
                    {s.content_status !== "approved" ? (
                      <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-normal uppercase text-neutral-500">
                        contenu : {s.content_status}
                      </span>
                    ) : null}
                  </td>
                  <td className="text-neutral-500">{s.slug}</td>
                  <td className="text-center">{s.coupon_count}</td>
                  <td className="text-center">
                    <ToggleSwitch table="stores" id={s.id} field="is_featured" value={s.is_featured} label="Vedette" tone="amber" />
                  </td>
                  <td className="text-center">
                    <ToggleSwitch table="stores" id={s.id} field="show_on_daily" value={s.show_on_daily} label="Offre du jour" tone="amber" />
                  </td>
                  <td className="text-center">
                    <ToggleSwitch table="stores" id={s.id} field="show_on_weekly" value={s.show_on_weekly} label="Offre de la semaine" tone="amber" />
                  </td>
                  <td className="text-center">
                    <ToggleSwitch table="stores" id={s.id} field="is_active" value={s.is_active} label="Actif" />
                  </td>
                  <td className="pr-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <a
                        href={storefront(s.slug)}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir la page publique"
                        aria-label="Ouvrir la page publique"
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:text-amber-300"
                      >
                        <ExternalLink size={15} aria-hidden />
                      </a>
                      <ActionButton action={generateContentAction.bind(null, s.id)} title="Mettre à jour / générer le contenu">
                        <Sparkles size={15} aria-hidden />
                      </ActionButton>
                      <ActionButton action={refreshOffersAction.bind(null, s.id)} title="Mettre à jour les codes">
                        <RefreshCw size={15} aria-hidden />
                      </ActionButton>

                      <details className="relative">
                        <summary
                          title="Assigner à une page événement"
                          className="inline-flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded text-neutral-500 hover:text-amber-300 [&::-webkit-details-marker]:hidden"
                        >
                          <CalendarPlus size={15} aria-hidden />
                        </summary>
                        <form
                          action={setStoreEvents}
                          className="absolute right-0 z-20 mt-1 w-56 rounded border border-neutral-300 bg-[#0a0f1c] p-3 text-left shadow-xl"
                        >
                          <input type="hidden" name="store_id" value={s.id} />
                          <input type="hidden" name="site_id" value={siteId} />
                          <p className="mb-2 text-xs font-semibold uppercase text-neutral-500">Pages événement</p>
                          {(events ?? []).length === 0 ? (
                            <p className="text-xs text-neutral-500">
                              Aucun événement.{" "}
                              <Link href="/admin/events" className="text-orange-700 underline">
                                En créer un
                              </Link>
                            </p>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {(events ?? []).map((ev) => (
                                <label key={ev.id} className="flex items-center gap-2 text-sm">
                                  <input type="checkbox" name="event_ids" value={ev.id} defaultChecked={mine?.has(ev.id)} />
                                  {ev.name}
                                </label>
                              ))}
                              <button type="submit" className="mt-2 rounded bg-neutral-900 px-2 py-1 text-xs">
                                Enregistrer
                              </button>
                            </div>
                          )}
                        </form>
                      </details>

                      <Link
                        href={`/admin/stores/${s.id}`}
                        title="Modifier"
                        aria-label="Modifier"
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:text-amber-300"
                      >
                        <Pencil size={15} aria-hidden />
                      </Link>
                      <ActionButton
                        action={deleteStoreAction.bind(null, s.id)}
                        title="Supprimer"
                        confirmMessage={`Supprimer ${s.name} et tous ses codes ?`}
                        danger
                      >
                        <Trash2 size={15} aria-hidden />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(stores ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">
            {q ? "Aucun résultat." : "Aucune boutique pour ce site. Utilisez Auto-Add ou « + Ajouter »."}
          </p>
        ) : null}
      </div>

      <Pagination basePath="/admin/stores" params={{ q }} page={page} total={count ?? 0} />
    </div>
  );
}
