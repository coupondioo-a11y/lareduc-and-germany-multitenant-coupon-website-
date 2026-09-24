import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { deletePost } from "./actions";

export default async function AdminBlogPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: posts } = await admin
    .from("blog_posts")
    .select("id, title, is_published, created_at")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Blog</h1>
        <Link href="/admin/blog/new" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
          Nouvel article
        </Link>
      </div>
      <ul className="divide-y divide-neutral-200 text-sm">
        {(posts ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <Link href={`/admin/blog/${p.id}`} className="text-orange-700 hover:underline">
              {p.title}
            </Link>
            <span className="flex items-center gap-3">
              <span className="text-neutral-500">{p.is_published ? "publié" : "brouillon"}</span>
              <form action={deletePost}>
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Supprimer
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
      {(posts ?? []).length === 0 ? <p className="text-sm text-neutral-500">Aucun article.</p> : null}
    </div>
  );
}
