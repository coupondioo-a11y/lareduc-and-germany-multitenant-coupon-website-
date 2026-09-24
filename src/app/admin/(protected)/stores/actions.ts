"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateStore(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();

  const { error } = await admin
    .from("stores")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      affiliate_url: String(formData.get("affiliate_url") ?? "").trim() || null,
      is_active: formData.get("is_active") === "on",
      is_featured: formData.get("is_featured") === "on",
      content_tier: String(formData.get("content_tier") ?? "standard"),
      last_updated: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const categoryIds = formData.getAll("category_ids").map(String);
  await admin.from("store_categories").delete().eq("store_id", id);
  if (categoryIds.length > 0) {
    const siteId = String(formData.get("site_id") ?? "");
    await admin
      .from("store_categories")
      .insert(categoryIds.map((categoryId) => ({ site_id: siteId, store_id: id, category_id: categoryId })));
  }

  revalidatePath("/admin/stores");
  redirect("/admin/stores");
}

export async function deleteStore(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  await admin.from("stores").delete().eq("id", id);

  revalidatePath("/admin/stores");
}
