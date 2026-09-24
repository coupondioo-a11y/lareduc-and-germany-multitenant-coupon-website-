import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

export default async function AdminAutomationPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [{ count: newStores }, { count: newCoupons }, { count: pendingContent }, { data: lastContent }] =
    await Promise.all([
      admin.from("stores").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", sevenDaysAgo),
      admin.from("coupons").select("id", { count: "exact", head: true }).eq("site_id", siteId).gte("created_at", sevenDaysAgo),
      admin.from("stores").select("id", { count: "exact", head: true }).eq("site_id", siteId).eq("content_status", "pending"),
      admin
        .from("stores")
        .select("name, content_generated_at")
        .eq("site_id", siteId)
        .not("content_generated_at", "is", null)
        .order("content_generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold">Automatisation</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded border border-neutral-200 p-4">
          <div className="text-2xl font-semibold">{newStores ?? 0}</div>
          <div className="text-sm text-neutral-500">Nouvelles boutiques (7j)</div>
        </div>
        <div className="rounded border border-neutral-200 p-4">
          <div className="text-2xl font-semibold">{newCoupons ?? 0}</div>
          <div className="text-sm text-neutral-500">Nouveaux codes (7j)</div>
        </div>
        <div className="rounded border border-neutral-200 p-4">
          <div className="text-2xl font-semibold">{pendingContent ?? 0}</div>
          <div className="text-sm text-neutral-500">Contenu en attente</div>
        </div>
      </div>

      {lastContent ? (
        <p className="mb-6 text-sm text-neutral-500">
          Dernière génération de contenu : {lastContent.name}, le{" "}
          {new Date(lastContent.content_generated_at).toLocaleString("fr-FR")}.
        </p>
      ) : null}

      <div className="rounded border border-neutral-200 p-4 text-sm">
        <p className="font-medium">Comment ça tourne</p>
        <p className="mt-2 text-neutral-500">
          Le scraper (<code>agents/index.js</code>) et la génération de contenu (
          <code>agents/content/index.js</code>) sont des scripts Node autonomes, exécutés par les workflows
          GitHub Actions (<code>.github/workflows/</code>), pas par cette application Next.js — c&apos;est
          voulu, ces automatisations tournent indépendamment du serveur web. Configurez les secrets
          (<code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>FIRECRAWL_API_KEY</code>, <code>DEEPSEEK_API_KEY</code>)
          dans les paramètres du dépôt GitHub pour les activer.
        </p>
      </div>
    </div>
  );
}
