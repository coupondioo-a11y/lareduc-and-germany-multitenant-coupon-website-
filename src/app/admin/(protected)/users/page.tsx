import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentAdminProfile, ADMIN_PERMISSIONS } from "@/lib/admin-auth";
import { createUser, toggleActive, updatePermissions } from "./actions";

export default async function AdminUsersPage() {
  const current = await getCurrentAdminProfile();
  const admin = createAdminClient();
  const { data: users } = await admin
    .from("admin_profiles")
    .select("id, email, permissions, is_active")
    .order("email");

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-lg font-semibold">Utilisateurs admin</h1>

      <details className="mb-6 rounded border border-neutral-200 p-4 text-sm">
        <summary className="cursor-pointer font-medium">Créer un utilisateur</summary>
        <form action={createUser} className="mt-3 flex flex-col gap-3">
          <input name="email" type="email" placeholder="Email" required className="rounded border border-neutral-300 px-3 py-2" />
          <input name="password" type="password" placeholder="Mot de passe (8+ caractères)" required minLength={8} className="rounded border border-neutral-300 px-3 py-2" />
          <fieldset className="flex flex-wrap gap-3">
            {ADMIN_PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center gap-1.5">
                <input type="checkbox" name={`perm_${p}`} />
                {p}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="w-fit rounded bg-neutral-900 px-3 py-2 text-white">
            Créer
          </button>
        </form>
      </details>

      <ul className="flex flex-col gap-4">
        {(users ?? []).map((u) => (
          <li key={u.id} className="rounded border border-neutral-200 p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{u.email}</span>
              <form action={toggleActive}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="is_active" value={String(u.is_active)} />
                <button
                  type="submit"
                  disabled={u.id === current?.id}
                  className="text-neutral-600 hover:underline disabled:opacity-40"
                >
                  {u.is_active ? "Désactiver" : "Activer"}
                </button>
              </form>
            </div>
            <form action={updatePermissions} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={u.id} />
              {ADMIN_PERMISSIONS.map((p) => (
                <label key={p} className="flex items-center gap-1.5">
                  <input type="checkbox" name={`perm_${p}`} defaultChecked={u.permissions?.includes(p)} />
                  {p}
                </label>
              ))}
              <button type="submit" className="rounded border border-neutral-300 px-2 py-1">
                Enregistrer
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
