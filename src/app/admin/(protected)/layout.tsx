import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteSwitcher } from "./SiteSwitcher";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentAdminProfile();
  if (!profile) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: sites } = await admin
    .from("sites")
    .select("id, country_code, brand_name")
    .order("country_code");

  const cookieStore = await cookies();
  const activeSiteId = cookieStore.get("admin_site_id")?.value ?? sites?.[0]?.id;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-neutral-200 p-4">
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/sites">Sites</Link>
          <Link href="/admin/push">Push</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-neutral-500">{profile.email}</span>
          <SiteSwitcher sites={sites ?? []} activeSiteId={activeSiteId} />
        </div>
        {children}
      </main>
    </div>
  );
}
