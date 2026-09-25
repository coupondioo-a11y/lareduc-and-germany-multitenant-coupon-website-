import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { SiteSwitcher } from "./SiteSwitcher";

const NAV: { label: string; href: string }[][] = [
  [
    { label: "Dashboard", href: "/admin" },
    { label: "Boutiques", href: "/admin/stores" },
    { label: "Codes", href: "/admin/coupons" },
    { label: "Catégories", href: "/admin/categories" },
    { label: "Événements", href: "/admin/events" },
    { label: "Signalés", href: "/admin/flagged" },
    { label: "Avis", href: "/admin/reviews" },
  ],
  [
    { label: "Auto-Add", href: "/admin/auto-add" },
    { label: "Automatisation", href: "/admin/automation" },
    { label: "Contenu SEO", href: "/admin/seo-content" },
    { label: "Contenu du site", href: "/admin/site-content" },
    { label: "Blog", href: "/admin/blog" },
  ],
  [
    { label: "Push", href: "/admin/push" },
    { label: "Newsletter", href: "/admin/newsletter" },
    { label: "Sécurité", href: "/admin/security" },
    { label: "Utilisateurs", href: "/admin/users" },
    { label: "Sites", href: "/admin/sites" },
  ],
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentAdminProfile();
  if (!profile) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: sites } = await admin
    .from("sites")
    .select("id, country_code, brand_name")
    .order("country_code");

  const activeSiteId = await getActiveSiteId();

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 h-screen w-52 shrink-0 overflow-y-auto border-r border-neutral-200 px-3 py-4">
        <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-neutral-500">Admin</p>
        <nav className="flex flex-col gap-4 text-sm">
          {NAV.map((group, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {group.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-1.5 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-neutral-500">{profile.email}</span>
          <SiteSwitcher sites={sites ?? []} activeSiteId={activeSiteId} />
        </div>
        {children}
      </main>
    </div>
  );
}
