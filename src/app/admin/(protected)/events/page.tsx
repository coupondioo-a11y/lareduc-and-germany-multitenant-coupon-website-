import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { ErrorBanner } from "../ErrorBanner";
import { createEvent, deleteEvent, toggleEvent } from "./actions";

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  const { data: events, error: readError } = await admin
    .from("events")
    .select("id, name, slug, is_active")
    .eq("site_id", siteId)
    .order("position");

  const { data: counts } = await admin.from("event_stores").select("event_id").eq("site_id", siteId);
  const perEvent = new Map<string, number>();
  for (const c of counts ?? []) perEvent.set(c.event_id, (perEvent.get(c.event_id) ?? 0) + 1);

  const missingTable = !!readError;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-white">Événements</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Pages thématiques (Black Friday, soldes, rentrée…) sur <code>/special/nom-de-l-evenement/</code>. Assignez-y
        des boutiques depuis la liste des boutiques (icône calendrier).
      </p>

      {missingTable ? (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          La table « events » n&apos;existe pas encore : exécutez <code>migrations/0004_events.sql</code> dans le
          SQL Editor de Supabase.
        </p>
      ) : null}
      <ErrorBanner code={error} />

      <form action={createEvent} className="mb-6 flex gap-2">
        <input name="name" placeholder="Nom de l'événement (ex : Black Friday)" required className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm">
          Créer
        </button>
      </form>

      <ul className="divide-y divide-neutral-200 text-sm">
        {(events ?? []).map((ev) => (
          <li key={ev.id} className="flex items-center justify-between py-2.5">
            <span>
              <span className={ev.is_active ? "font-medium text-white" : "text-neutral-500 line-through"}>{ev.name}</span>{" "}
              <span className="text-neutral-500">
                /special/{ev.slug}/ · {perEvent.get(ev.id) ?? 0} boutique(s)
              </span>
            </span>
            <span className="flex items-center gap-3">
              <form action={toggleEvent}>
                <input type="hidden" name="id" value={ev.id} />
                <input type="hidden" name="is_active" value={String(ev.is_active)} />
                <button type="submit" className="text-neutral-500 hover:underline">
                  {ev.is_active ? "Désactiver" : "Activer"}
                </button>
              </form>
              <form action={deleteEvent}>
                <input type="hidden" name="id" value={ev.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Supprimer
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
