import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTestPush } from "../actions";

export default async function AdminPushPage() {
  const cookieStore = await cookies();
  const admin = createAdminClient();

  const { data: sites } = await admin.from("sites").select("id").order("country_code");
  const siteId = cookieStore.get("admin_site_id")?.value ?? sites?.[0]?.id ?? "";

  const [{ count: subscriberCount }, { data: log }] = await Promise.all([
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    admin
      .from("push_notifications_log")
      .select("title, body, sent_count, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <div className="max-w-md">
      <h1 className="mb-2 text-lg font-semibold">Push</h1>
      <p className="mb-4 text-sm text-neutral-500">
        {subscriberCount ?? 0} abonné{(subscriberCount ?? 0) > 1 ? "s" : ""} sur ce site.
      </p>

      <form action={sendTestPush} className="flex flex-col gap-3">
        <input type="hidden" name="siteId" value={siteId} />
        <label className="flex flex-col gap-1 text-sm">
          Titre
          <input name="title" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Message
          <textarea name="body" required rows={3} className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <button type="submit" className="mt-2 rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Envoyer
        </button>
      </form>

      {(log ?? []).length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Historique</h2>
          <ul className="space-y-2 text-sm">
            {(log ?? []).map((l, i) => (
              <li key={i} className="border-b border-neutral-200 pb-2">
                <span className="font-medium">{l.title}</span> — {l.sent_count} envoyé(s)
                <span className="block text-neutral-500">{l.body}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
