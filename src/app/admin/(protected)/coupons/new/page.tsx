import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { createCoupon } from "../actions";
import { CouponForm } from "../CouponForm";

export default async function NewCouponPage() {
  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: stores } = await admin.from("stores").select("id, name").eq("site_id", siteId).order("name");

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Nouveau code</h1>
      <CouponForm action={createCoupon} stores={stores ?? []} />
    </div>
  );
}
