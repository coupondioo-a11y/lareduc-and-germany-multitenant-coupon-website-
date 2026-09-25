"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { hostOf, storeSlug } from "@/lib/slug";

/** Manual store creation -- no scraping. For the automated flow see Auto-Add. */
export async function createStoreManual(formData: FormData): Promise<void> {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");

  const name = String(formData.get("name") ?? "").trim();
  const domainInput = String(formData.get("domain") ?? "").trim();
  if (!name) redirect("/admin/stores/new?error=name_required");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { data: site } = await admin.from("sites").select("store_slug_pattern").eq("id", siteId).single();

  const host = domainInput ? hostOf(domainInput) : "";
  const { data: created, error } = await admin
    .from("stores")
    .insert({
      site_id: siteId,
      name,
      slug: storeSlug(site?.store_slug_pattern ?? "{store}", name),
      description: String(formData.get("description") ?? "").trim() || null,
      affiliate_url: String(formData.get("affiliate_url") ?? "").trim() || (host ? `https://${host}/` : null),
      is_active: true,
      content_status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") redirect("/admin/stores/new?error=duplicate");
    throw new Error(error.message);
  }

  revalidateTag("homepage");
  redirect(`/admin/stores/${created.id}`);
}
