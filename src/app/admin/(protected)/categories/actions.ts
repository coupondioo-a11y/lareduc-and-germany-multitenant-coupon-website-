"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "categories");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nom requis");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { error } = await admin.from("categories").insert({ site_id: siteId, name, slug: slugify(name) });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "categories");

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  await admin.from("categories").delete().eq("id", id);

  revalidatePath("/admin/categories");
}
