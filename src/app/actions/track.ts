"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function trackStoreClick(storeId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("stores").select("click_count").eq("id", storeId).maybeSingle();
  if (data) {
    await admin.from("stores").update({ click_count: data.click_count + 1 }).eq("id", storeId);
  }
}

export async function trackCouponClick(couponId: string, storeId: string) {
  const admin = createAdminClient();
  const [{ data: coupon }, { data: store }] = await Promise.all([
    admin.from("coupons").select("click_count").eq("id", couponId).maybeSingle(),
    admin.from("stores").select("click_count").eq("id", storeId).maybeSingle(),
  ]);
  await Promise.all([
    coupon
      ? admin.from("coupons").update({ click_count: coupon.click_count + 1 }).eq("id", couponId)
      : Promise.resolve(),
    store
      ? admin.from("stores").update({ click_count: store.click_count + 1 }).eq("id", storeId)
      : Promise.resolve(),
  ]);
}
