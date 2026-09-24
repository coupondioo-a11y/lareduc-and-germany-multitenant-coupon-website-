import { cookies } from "next/headers";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

async function count(admin: ReturnType<typeof createAdminClient>, table: string, siteId: string, extra?: Record<string, unknown>) {
  let query = admin.from(table).select("id", { count: "exact", head: true }).eq("site_id", siteId);
  if (extra) query = query.match(extra);
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const admin = createAdminClient();
  const { data: sites } = await admin.from("sites").select("id").order("country_code");
  const siteId = cookieStore.get("admin_site_id")?.value ?? sites?.[0]?.id ?? "";

  const [stores, coupons, pendingContent, flagged, pendingReviews] = await Promise.all([
    count(admin, "stores", siteId, { is_active: true }),
    count(admin, "coupons", siteId, { is_active: true }),
    count(admin, "stores", siteId, { content_status: "pending" }),
    count(admin, "flagged_coupons", siteId, { status: "pending" }),
    count(admin, "store_reviews", siteId, { is_approved: false }),
  ]);

  const tiles = [
    { label: "Boutiques actives", value: stores, href: "/admin/stores" },
    { label: "Codes actifs", value: coupons, href: "/admin/coupons" },
    { label: "Contenu en attente", value: pendingContent, href: "/admin/seo-content" },
    { label: "Codes signalés", value: flagged, href: "/admin/flagged" },
    { label: "Avis à modérer", value: pendingReviews, href: "/admin/reviews" },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="rounded border border-neutral-200 p-4 transition-colors hover:bg-neutral-50"
          >
            <div className="text-2xl font-semibold">{t.value}</div>
            <div className="mt-1 text-sm text-neutral-500">{t.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
