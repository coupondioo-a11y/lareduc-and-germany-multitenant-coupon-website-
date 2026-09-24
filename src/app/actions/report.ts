"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function reportCoupon(siteId: string, couponId: string, reason: string) {
  if (!couponId || !reason.trim()) return { ok: false };

  const admin = createAdminClient();
  const { error } = await admin.from("flagged_coupons").insert({
    site_id: siteId,
    coupon_id: couponId,
    reason: reason.trim(),
  });

  return { ok: !error };
}
