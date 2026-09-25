import Link from "next/link";
import { Pencil, Search, Trash2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { ActionButton, SelectAll, ToggleSwitch } from "../controls";
import { Pagination, PAGE_SIZE, cleanQuery } from "../Pagination";
import { bulkActivateCoupons, bulkDeactivateCoupons, bulkDeleteCoupons, deleteCouponAction } from "../row-actions";

interface Params {
  q?: string;
  store?: string;
  status?: string;
  type?: string;
  page?: string;
}

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const storeFilter = cleanQuery(sp.store);
  const status = sp.status ?? "";
  const type = sp.type ?? "";
  const page = Math.max(1, Number(sp.page) || 1);
  const today = new Date().toISOString().slice(0, 10);

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  // Store names are searched separately, then matched by id -- PostgREST can't OR across a joined table.
  async function storeIds(term: string): Promise<string[]> {
    const { data } = await admin.from("stores").select("id").eq("site_id", siteId).ilike("name", `%${term}%`).limit(200);
    return (data ?? []).map((s) => s.id);
  }

  let query = admin
    .from("coupons")
    .select(
      "id, title, type, code, discount_value, expiry_date, is_active, is_daily_deal, is_weekly_deal, click_count, store:stores(id, name)",
      { count: "exact" }
    )
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  let empty = false;
  if (storeFilter) {
    const ids = await storeIds(storeFilter);
    if (ids.length === 0) empty = true;
    else query = query.in("store_id", ids);
  }
  if (q) {
    const ids = await storeIds(q);
    const parts = [`title.ilike.%${q}%`, `code.ilike.%${q}%`];
    if (ids.length > 0) parts.push(`store_id.in.(${ids.join(",")})`);
    query = query.or(parts.join(","));
  }
  if (type) query = query.eq("type", type);
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);
  if (status === "expired") query = query.lt("expiry_date", today);
  if (status === "valid") query = query.or(`expiry_date.is.null,expiry_date.gte.${today}`);

  const { data: coupons, count } = empty ? { data: [], count: 0 } : await query;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Codes promo</h1>
        <Link href="/admin/coupons/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm">
          + Ajouter
        </Link>
      </div>

      <form className="mb-2 flex flex-wrap gap-2">
        <div className="relative min-w-[16rem] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher par boutique, titre ou code…"
            className="w-full rounded border border-neutral-300 py-2 pl-9 pr-3"
          />
        </div>
        <input
          name="store"
          defaultValue={storeFilter}
          placeholder="Filtrer par boutique…"
          className="w-48 rounded border border-neutral-300 px-3 py-2"
        />
        <select name="status" defaultValue={status} className="rounded border border-neutral-300 px-2 py-2">
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
          <option value="valid">Non expirés</option>
          <option value="expired">Expirés</option>
        </select>
        <select name="type" defaultValue={type} className="rounded border border-neutral-300 px-2 py-2">
          <option value="">Tous les types</option>
          <option value="code">Codes</option>
          <option value="deal">Offres</option>
          <option value="free_shipping">Livraison</option>
        </select>
        <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-sm">
          Filtrer
        </button>
      </form>
      <p className="mb-3 text-xs text-neutral-500">{count ?? 0} code(s)</p>

      <form id="bulk-form" className="mb-2 flex items-center gap-2 text-xs">
        <span className="text-neutral-500">Sélection :</span>
        <button formAction={bulkActivateCoupons} className="rounded border border-neutral-300 px-2 py-1">
          Activer
        </button>
        <button formAction={bulkDeactivateCoupons} className="rounded border border-neutral-300 px-2 py-1">
          Désactiver
        </button>
        <button formAction={bulkDeleteCoupons} className="rounded border border-red-300 px-2 py-1 text-red-600">
          Supprimer
        </button>
      </form>

      <div className="overflow-x-auto rounded border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="w-8 px-3 py-2.5">
                <SelectAll formId="bulk-form" />
              </th>
              <th>Titre</th>
              <th>Boutique</th>
              <th>Code</th>
              <th>Type</th>
              <th>Réduction</th>
              <th>Expiration</th>
              <th className="text-center">Jour</th>
              <th className="text-center">Sem.</th>
              <th className="text-center">Actif</th>
              <th className="pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(coupons ?? []).map((c) => {
              const store = Array.isArray(c.store) ? c.store[0] : c.store;
              const expired = !!c.expiry_date && c.expiry_date < today;
              return (
                <tr key={c.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2">
                    <input type="checkbox" name="ids" value={c.id} form="bulk-form" />
                  </td>
                  <td className="max-w-xs truncate font-medium text-white" title={c.title}>
                    {c.title}
                  </td>
                  <td className="text-neutral-500">{store?.name ?? "—"}</td>
                  <td>
                    {c.code ? (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-xs">{c.code}</span>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                  <td className="text-neutral-500">{c.type}</td>
                  <td className="font-medium text-amber-300">{c.discount_value ?? ""}</td>
                  <td>
                    {c.expiry_date ? (
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {new Date(c.expiry_date).toLocaleDateString("fr-FR")}
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                            expired ? "bg-red-500/20 text-red-400" : "bg-emerald-500/15 text-emerald-400"
                          }`}
                        >
                          {expired ? "Expiré" : "Valide"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-neutral-500">Sans date</span>
                    )}
                  </td>
                  <td className="text-center">
                    <ToggleSwitch table="coupons" id={c.id} field="is_daily_deal" value={c.is_daily_deal} label="Offre du jour" tone="amber" />
                  </td>
                  <td className="text-center">
                    <ToggleSwitch table="coupons" id={c.id} field="is_weekly_deal" value={c.is_weekly_deal} label="Offre de la semaine" tone="amber" />
                  </td>
                  <td className="text-center">
                    <ToggleSwitch table="coupons" id={c.id} field="is_active" value={c.is_active} label="Actif" />
                  </td>
                  <td className="pr-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={`/admin/coupons/${c.id}`}
                        title="Modifier"
                        aria-label="Modifier"
                        className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-500 hover:text-amber-300"
                      >
                        <Pencil size={15} aria-hidden />
                      </Link>
                      <ActionButton
                        action={deleteCouponAction.bind(null, c.id)}
                        title="Supprimer"
                        confirmMessage="Supprimer ce code ?"
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
        {(coupons ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">Aucun code ne correspond à ces filtres.</p>
        ) : null}
      </div>

      <Pagination basePath="/admin/coupons" params={{ q, store: storeFilter, status, type }} page={page} total={count ?? 0} />
    </div>
  );
}
