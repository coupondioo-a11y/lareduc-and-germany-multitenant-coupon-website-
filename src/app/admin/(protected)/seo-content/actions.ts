"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { regenerateStoreSeo } from "@/lib/store-import";

export async function regenerate(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "seo_content");

  const storeId = String(formData.get("store_id") ?? "");
  const result = await regenerateStoreSeo(storeId);
  if (!result.ok) throw new Error(result.error ?? "Génération échouée");

  revalidatePath(`/admin/seo-content/${storeId}`);
}

export async function setContentStatus(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "seo_content");

  const storeId = String(formData.get("store_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const admin = createAdminClient();

  const fields: Record<string, unknown> = { content_status: status };
  if (status === "approved") {
    fields.content_approved_at = new Date().toISOString();
    fields.content_approved_by = profile!.id;
  }

  await admin.from("stores").update(fields).eq("id", storeId);
  revalidatePath(`/admin/seo-content/${storeId}`);
  revalidatePath("/admin/seo-content");
}
