import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { updateCoupon } from "../actions";
import { CouponForm } from "../CouponForm";

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  const [{ data: coupon }, { data: stores }] = await Promise.all([
    admin
      .from("coupons")
      .select("id, store_id, title, type, code, discount_value, expiry_date, destination_url, is_active, is_featured")
      .eq("id", id)
      .maybeSingle(),
    admin.from("stores").select("id, name").eq("site_id", siteId).order("name"),
  ]);

  if (!coupon) notFound();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Modifier le code</h1>
      <CouponForm action={updateCoupon} stores={stores ?? []} coupon={coupon} />
    </div>
  );
}
