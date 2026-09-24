import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { regenerate, setContentStatus } from "../actions";

export default async function SeoContentDetailPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const admin = createAdminClient();
  const { data: store } = await admin
    .from("stores")
    .select("id, name, content_status, content_body, content_generated_at")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) notFound();
  const content = store.content_body;

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{store.name}</h1>
        <span className="rounded bg-neutral-100 px-2 py-1 text-xs">{store.content_status}</span>
      </div>

      <div className="mb-6 flex gap-2">
        <form action={regenerate}>
          <input type="hidden" name="store_id" value={store.id} />
          <input type="hidden" name="store_name" value={store.name} />
          <button type="submit" className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white">
            Régénérer (DeepSeek)
          </button>
        </form>
        {store.content_status !== "approved" ? (
          <form action={setContentStatus}>
            <input type="hidden" name="store_id" value={store.id} />
            <input type="hidden" name="status" value="approved" />
            <button type="submit" className="rounded bg-emerald-700 px-3 py-1.5 text-sm text-white">
              Approuver
            </button>
          </form>
        ) : (
          <form action={setContentStatus}>
            <input type="hidden" name="store_id" value={store.id} />
            <input type="hidden" name="status" value="draft" />
            <button type="submit" className="rounded border border-neutral-300 px-3 py-1.5 text-sm">
              Repasser en brouillon
            </button>
          </form>
        )}
      </div>

      {content ? (
        <div className="flex flex-col gap-6 text-sm">
          <section>
            <h2 className="mb-1 font-medium">Description</h2>
            <p className="text-neutral-700">{content.description}</p>
          </section>
          <section>
            <h2 className="mb-1 font-medium">Sections</h2>
            {content.h2Sections?.map((s: { h2: string; body: string }, i: number) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{s.h2}</p>
                <p className="text-neutral-700">{s.body}</p>
              </div>
            ))}
          </section>
          <section>
            <h2 className="mb-1 font-medium">FAQ</h2>
            {content.faqs?.map((f: { q: string; a: string }, i: number) => (
              <div key={i} className="mb-2">
                <p className="font-medium">{f.q}</p>
                <p className="text-neutral-700">{f.a}</p>
              </div>
            ))}
          </section>
          <section>
            <h2 className="mb-1 font-medium">Astuces</h2>
            <ul className="list-disc pl-5 text-neutral-700">
              {content.proTips?.map((t: string, i: number) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">Aucun contenu généré pour l&apos;instant.</p>
      )}
    </div>
  );
}
