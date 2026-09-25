"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { importStore, type ImportResult } from "@/lib/store-import";
import { hostOf } from "@/lib/slug";

/** The pipeline: store domain -> competitor page -> humanized offers -> store + SEO content. Runs ~1 minute. */
export async function runImport(formData: FormData): Promise<ImportResult> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "auto_add");

  const siteId = await getActiveSiteId();
  const result = await importStore(siteId, {
    domain: String(formData.get("domain") ?? ""),
    name: String(formData.get("name") ?? ""),
    sourceUrl: String(formData.get("source_url") ?? ""),
  });

  revalidatePath("/admin/stores");
  return result;
}

/** Competitor coupon sites searched when looking for a store's offers. */
export async function createTarget(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "auto_add");

  const domain = hostOf(String(formData.get("domain") ?? ""));
  const pattern = String(formData.get("store_page_pattern") ?? "").trim();
  if (!domain.includes(".")) return;

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("scrape_targets")
    .select("id")
    .eq("site_id", siteId)
    .eq("domain", domain)
    .maybeSingle();

  if (existing) {
    await admin.from("scrape_targets").update({ store_page_pattern: pattern, is_active: true }).eq("id", existing.id);
  } else {
    await admin.from("scrape_targets").insert({ site_id: siteId, domain, store_page_pattern: pattern });
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
