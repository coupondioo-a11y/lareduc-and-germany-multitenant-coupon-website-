"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

export async function createHeroSlide(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { error } = await admin.from("hero_slides").insert({
    site_id: siteId,
    store_id: String(formData.get("store_id") ?? "") || null,
    headline: String(formData.get("headline") ?? "").trim(),
    figure: String(formData.get("figure") ?? "").trim() || null,
    cta_label: String(formData.get("cta_label") ?? "").trim() || null,
    cta_href: String(formData.get("cta_href") ?? "").trim() || null,
    from_color: String(formData.get("from_color") ?? "").trim() || null,
    to_color: String(formData.get("to_color") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/site-content");
}

export async function deleteHeroSlide(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");
  const admin = createAdminClient();
  await admin.from("hero_slides").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/site-content");
}

export async function createBanner(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { error } = await admin.from("sidebar_banners").insert({
    site_id: siteId,
    store_id: String(formData.get("store_id") ?? "") || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    href: String(formData.get("href") ?? "").trim() || null,
    alt: String(formData.get("alt") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/site-content");
}

export async function deleteBanner(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");
  const admin = createAdminClient();
  await admin.from("sidebar_banners").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/site-content");
}

export async function saveSiteStats(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const fields = {
    codes_used_label: String(formData.get("codes_used_label") ?? "").trim() || null,
    codes_used_note: String(formData.get("codes_used_note") ?? "").trim() || null,
    saved_label: String(formData.get("saved_label") ?? "").trim() || null,
    saved_note: String(formData.get("saved_note") ?? "").trim() || null,
    verified_label: String(formData.get("verified_label") ?? "").trim() || null,
    verified_note: String(formData.get("verified_note") ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin.from("site_stats").select("site_id").eq("site_id", siteId).maybeSingle();
  if (existing) {
    await admin.from("site_stats").update(fields).eq("site_id", siteId);
  } else {
    await admin.from("site_stats").insert({ site_id: siteId, ...fields });
  }

  revalidatePath("/admin/site-content");
}
