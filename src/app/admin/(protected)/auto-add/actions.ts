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

  // Domain already tracked for this site -- update its pattern instead of
  // crashing on the unique constraint (a thrown server action leaves React's
  // tree in a bad state, which is what caused the removeChild error too).
  const { data: existing } = await admin
    .from("scrape_targets")
    .select("id")
    .eq("site_id", siteId)
    .eq("domain", domain)
    .maybeSingle();

  if (existing) {
    await admin.from("scrape_targets").update({ store_page_pattern: pattern, is_active: true }).eq("id", existing.id);
  } else {
    const { error } = await admin
      .from("scrape_targets")
      .insert({ site_id: siteId, domain, store_page_pattern: pattern });
    if (error) throw new Error(error.message);
  }

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
