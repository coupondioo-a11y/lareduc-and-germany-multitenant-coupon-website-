"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

export async function createTarget(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "auto_add");

  const domain = String(formData.get("domain") ?? "").trim();
  const pattern = String(formData.get("store_page_pattern") ?? "").trim();
  if (!domain || !pattern) throw new Error("Champs requis manquants");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { error } = await admin
    .from("scrape_targets")
    .insert({ site_id: siteId, domain, store_page_pattern: pattern });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/auto-add");
}

export async function toggleTarget(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "auto_add");

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  const admin = createAdminClient();
  await admin.from("scrape_targets").update({ is_active: !isActive }).eq("id", id);

  revalidatePath("/admin/auto-add");
}

export async function deleteTarget(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "auto_add");

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  await admin.from("scrape_targets").delete().eq("id", id);

  revalidatePath("/admin/auto-add");
}
