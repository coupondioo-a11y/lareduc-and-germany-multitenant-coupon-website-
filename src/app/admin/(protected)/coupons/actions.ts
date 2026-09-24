"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

async function recomputeCouponCount(admin: ReturnType<typeof createAdminClient>, storeId: string) {
  const { count } = await admin
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("is_active", true);
  await admin.from("stores").update({ coupon_count: count ?? 0 }).eq("id", storeId);
}

function couponFields(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim() || null;
  return {
    store_id: String(formData.get("store_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    type: code ? "code" : (String(formData.get("type") ?? "deal") as "deal" | "free_shipping"),
    code,
    discount_value: String(formData.get("discount_value") ?? "").trim() || null,
    expiry_date: String(formData.get("expiry_date") ?? "").trim() || null,
    destination_url: String(formData.get("destination_url") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
  };
}

export async function createCoupon(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "coupons");

  const siteId = await getActiveSiteId();
  const fields = couponFields(formData);
  if (!fields.store_id || !fields.title) throw new Error("Champs requis manquants");

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").insert({ site_id: siteId, ...fields });
  if (error) throw new Error(error.message);

  await recomputeCouponCount(admin, fields.store_id);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function updateCoupon(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "coupons");

  const id = String(formData.get("id") ?? "");
  const fields = couponFields(formData);

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  await recomputeCouponCount(admin, fields.store_id);
  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "coupons");

  const id = String(formData.get("id") ?? "");
  const storeId = String(formData.get("store_id") ?? "");
  const admin = createAdminClient();
  await admin.from("coupons").delete().eq("id", id);
  await recomputeCouponCount(admin, storeId);

  revalidatePath("/admin/coupons");
}
