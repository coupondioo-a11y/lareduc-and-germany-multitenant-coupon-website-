import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { createCategory, deleteCategory } from "./actions";
import { ErrorBanner } from "../ErrorBanner";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: categories } = await admin
    .from("categories")
    .select("id, name, slug, position")
    .eq("site_id", siteId)
    .order("position");

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Catégories</h1>
      <ErrorBanner code={error} />

      <form action={createCategory} className="mb-6 flex gap-2">
        <input
          name="name"
          placeholder="Nouvelle catégorie"
          required
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Ajouter
        </button>
      </form>

      <ul className="divide-y divide-neutral-200">
        {(categories ?? []).map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2 text-sm">
            <span>
              {c.name} <span className="text-neutral-400">/{c.slug}</span>
            </span>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button type="submit" className="text-red-600 hover:underline">
                Supprimer
              </button>
            </form>
          </li>
        ))}
        {(categories ?? []).length === 0 ? (
          <li className="py-2 text-sm text-neutral-500">Aucune catégorie pour ce site.</li>
        ) : null}
      </ul>
    </div>
  );
}
