import { createAdminClient } from "@/lib/supabase/admin";
import { addAllowedIp, removeAllowedIp } from "./actions";

export default async function AdminSecurityPage() {
  const admin = createAdminClient();
  const { data: proxies } = await admin.from("allowed_proxies").select("id, ip, label").order("created_at");

  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-lg font-semibold">Sécurité</h1>

      <div className="mb-6 rounded border border-neutral-200 p-4 text-sm">
        <p className="font-medium">Protections actives (middleware.ts)</p>
        <ul className="mt-2 list-disc pl-5 text-neutral-600">
          <li>Détection de request smuggling (Content-Length + Transfer-Encoding, corps sur DELETE/OPTIONS)</li>
          <li>Rejet des requêtes sans User-Agent</li>
          <li>Suppression des en-têtes internes usurpables (x-nextjs-data, x-admin-id)</li>
          <li>Limitation à 100 req/min par IP sur les routes /admin (compteur en mémoire, par instance)</li>
          <li>Session + profil actif requis sur toutes les routes /admin</li>
        </ul>
      </div>

      <h2 className="mb-2 font-medium">IP autorisées (accès direct hors proxy réseau)</h2>
      <form action={addAllowedIp} className="mb-4 flex gap-2">
        <input name="ip" placeholder="Adresse IP" required className="rounded border border-neutral-300 px-3 py-2 text-sm" />
        <input name="label" placeholder="Libellé (optionnel)" className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Ajouter
        </button>
      </form>

      <ul className="divide-y divide-neutral-200 text-sm">
        {(proxies ?? []).map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2">
            <span>
              {p.ip} {p.label ? <span className="text-neutral-400">— {p.label}</span> : null}
            </span>
            <form action={removeAllowedIp}>
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="text-red-600 hover:underline">
                Supprimer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
