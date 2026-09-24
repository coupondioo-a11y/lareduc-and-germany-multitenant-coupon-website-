import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateStore } from "../actions";

export default async function EditStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: store } = await admin
    .from("stores")
    .select("id, site_id, name, description, affiliate_url, is_active, is_featured, content_tier")
    .eq("id", id)
    .maybeSingle();

  if (!store) notFound();

  const [{ data: categories }, { data: assigned }] = await Promise.all([
    admin.from("categories").select("id, name").eq("site_id", store.site_id).order("name"),
    admin.from("store_categories").select("category_id").eq("store_id", id),
  ]);
  const assignedIds = new Set((assigned ?? []).map((r) => r.category_id));

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">{store.name}</h1>
      <div className="mb-4 flex gap-4 text-sm">
        <Link href={`/admin/seo-content/${store.id}`} className="text-orange-700 hover:underline">
          Voir le contenu SEO
        </Link>
        <Link href={`/admin/logo-manager/${store.id}`} className="text-orange-700 hover:underline">
          Gérer le logo
        </Link>
      </div>

      <form action={updateStore} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={store.id} />
        <input type="hidden" name="site_id" value={store.site_id} />

        <label className="flex flex-col gap-1 text-sm">
          Nom
          <input
            name="name"
            defaultValue={store.name}
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea
            name="description"
            defaultValue={store.description ?? ""}
            rows={3}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          URL affiliée
          <input
            name="affiliate_url"
            defaultValue={store.affiliate_url ?? ""}
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Niveau de contenu
          <select name="content_tier" defaultValue={store.content_tier} className="rounded border border-neutral-300 px-3 py-2">
            <option value="light">light</option>
            <option value="standard">standard</option>
            <option value="premium">premium</option>
          </select>
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1 font-medium">Catégories</legend>
          {(categories ?? []).map((c) => (
            <label key={c.id} className="flex items-center gap-2">
              <input type="checkbox" name="category_ids" value={c.id} defaultChecked={assignedIds.has(c.id)} />
              {c.name}
            </label>
          ))}
          {(categories ?? []).length === 0 ? (
            <p className="text-neutral-500">Aucune catégorie créée pour ce site.</p>
          ) : null}
        </fieldset>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={store.is_active} />
          Actif
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={store.is_featured} />
          Mis en avant
        </label>

        <button type="submit" className="mt-2 rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
