"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveFlag(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "flagged");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const deactivateCoupon = formData.get("deactivate_coupon") === "on";
  const couponId = String(formData.get("coupon_id") ?? "");

  const admin = createAdminClient();
  await admin
    .from("flagged_coupons")
    .update({ status, resolved_by: profile!.id, resolved_at: new Date().toISOString() })
    .eq("id", id);

  if (deactivateCoupon && couponId) {
    await admin.from("coupons").update({ is_active: false }).eq("id", couponId);
  }

  revalidatePath("/admin/flagged");
}
