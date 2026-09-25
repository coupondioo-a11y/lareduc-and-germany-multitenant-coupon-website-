"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentAdminProfile, requirePermission, type AdminPermission } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshStoreOffers, regenerateStoreSeo } from "@/lib/store-import";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Whitelist -- table/field come from the client, never trust them into a query.
const TOGGLES: Record<string, { permission: AdminPermission; fields: string[] }> = {
  stores: { permission: "stores", fields: ["is_featured", "show_on_daily", "show_on_weekly", "is_active"] },
  coupons: { permission: "coupons", fields: ["is_featured", "is_daily_deal", "is_weekly_deal", "is_active"] },
};

async function recountStore(admin: ReturnType<typeof createAdminClient>, storeId: string) {
  const { count } = await admin
    .from("coupons")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .eq("is_active", true);
  await admin.from("stores").update({ coupon_count: count ?? 0 }).eq("id", storeId);
}

export async function toggleField(table: string, id: string, field: string, value: boolean): Promise<ActionResult> {
  const rule = TOGGLES[table];
  if (!rule || !rule.fields.includes(field)) return { ok: false, error: "Champ non autorisé" };

  const profile = await getCurrentAdminProfile();
  requirePermission(profile, rule.permission);

  const admin = createAdminClient();
  const { error } = await admin.from(table).update({ [field]: value }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (table === "coupons" && field === "is_active") {
    const { data } = await admin.from("coupons").select("store_id").eq("id", id).maybeSingle();
    if (data) await recountStore(admin, data.store_id);
  }
  revalidateTag("homepage");
  return { ok: true };
}

export async function refreshOffersAction(storeId: string): Promise<ActionResult> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");
  const r = await refreshStoreOffers(storeId);
  revalidatePath("/admin/stores");
  revalidatePath("/admin/coupons");
  return { ok: r.ok, error: r.error };
}

export async function generateContentAction(storeId: string): Promise<ActionResult> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "seo_content");
  const r = await regenerateStoreSeo(storeId);
  revalidatePath("/admin/stores");
  return { ok: r.ok, error: r.error };
}

export async function deleteStoreAction(storeId: string): Promise<ActionResult> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");
  const admin = createAdminClient();
  const { error } = await admin.from("stores").delete().eq("id", storeId);
  if (error) return { ok: false, error: error.message };
  revalidateTag("homepage");
  revalidatePath("/admin/stores");
  return { ok: true };
}

export async function deleteCouponAction(couponId: string): Promise<ActionResult> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "coupons");
  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("store_id").eq("id", couponId).maybeSingle();
  const { error } = await admin.from("coupons").delete().eq("id", couponId);
  if (error) return { ok: false, error: error.message };
  if (data) await recountStore(admin, data.store_id);
  revalidateTag("homepage");
  revalidatePath("/admin/coupons");
  return { ok: true };
}

/** Replace a store's event assignments with the checked set. */
export async function setStoreEvents(formData: FormData): Promise<void> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");

  const storeId = String(formData.get("store_id") ?? "");
  const siteId = String(formData.get("site_id") ?? "");
  const eventIds = formData.getAll("event_ids").map(String);

  const admin = createAdminClient();
  await admin.from("event_stores").delete().eq("store_id", storeId);
  if (eventIds.length > 0) {
    await admin
      .from("event_stores")
      .insert(eventIds.map((event_id) => ({ event_id, store_id: storeId, site_id: siteId })));
  }
  revalidatePath("/admin/stores");
}

async function bulkCoupons(formData: FormData, op: "activate" | "deactivate" | "delete") {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "coupons");

  const ids = formData.getAll("ids").map(String);
  if (ids.length === 0) return;

  const admin = createAdminClient();
  const { data } = await admin.from("coupons").select("store_id").in("id", ids);
  const storeIds = [...new Set((data ?? []).map((r) => r.store_id))];

  if (op === "delete") await admin.from("coupons").delete().in("id", ids);
  else await admin.from("coupons").update({ is_active: op === "activate" }).in("id", ids);

  for (const storeId of storeIds) await recountStore(admin, storeId);
  revalidateTag("homepage");
  revalidatePath("/admin/coupons");
}

export async function bulkActivateCoupons(formData: FormData) {
  await bulkCoupons(formData, "activate");
}
export async function bulkDeactivateCoupons(formData: FormData) {
  await bulkCoupons(formData, "deactivate");
}
export async function bulkDeleteCoupons(formData: FormData) {
  await bulkCoupons(formData, "delete");
}
