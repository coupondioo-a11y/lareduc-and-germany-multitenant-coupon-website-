"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";
import { slugify } from "@/lib/slug";

export async function createEvent(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/events?error=name_required");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const { error } = await admin.from("events").insert({ site_id: siteId, name, slug: slugify(name) });
  if (error) {
    if (error.code === "23505") redirect("/admin/events?error=duplicate");
    if (error.code === "42P01" || error.code === "PGRST205") redirect("/admin/events?error=no_table");
    throw new Error(error.message);
  }
  revalidatePath("/admin/events");
}

export async function toggleEvent(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";
  await createAdminClient().from("events").update({ is_active: !isActive }).eq("id", id);
  revalidatePath("/admin/events");
}

export async function deleteEvent(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  await createAdminClient().from("events").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/events");
}
