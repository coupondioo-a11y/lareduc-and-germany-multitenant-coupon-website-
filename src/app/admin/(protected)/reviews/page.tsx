import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { moderateReview } from "./actions";

export default async function AdminReviewsPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: reviews } = await admin
    .from("store_reviews")
    .select("id, author_name, rating, body, is_seeded, created_at, store:stores(name)")
    .eq("site_id", siteId)
    .eq("is_approved", false)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold">Avis en attente</h1>
      <ul className="flex flex-col gap-3">
        {(reviews ?? []).map((r) => {
          const store = Array.isArray(r.store) ? r.store[0] : r.store;
          return (
            <li key={r.id} className="rounded border border-neutral-200 p-4 text-sm">
              <p className="font-medium">
                {store?.name} — {r.author_name} ({r.rating}/5){r.is_seeded ? " · IA" : ""}
              </p>
              <p className="mt-1 text-neutral-600">{r.body}</p>
              <div className="mt-3 flex gap-2">
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="approve" value="true" />
                  <button type="submit" className="rounded bg-emerald-700 px-3 py-1.5 text-white">
                    Approuver
                  </button>
                </form>
                <form action={moderateReview}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="approve" value="false" />
                  <button type="submit" className="rounded border border-neutral-300 px-3 py-1.5">
                    Rejeter
                  </button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
      {(reviews ?? []).length === 0 ? <p className="text-sm text-neutral-500">Aucun avis en attente.</p> : null}
    </div>
  );
}
