"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function addAllowedIp(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "security");

  const ip = String(formData.get("ip") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim() || null;
  if (!ip) throw new Error("IP requise");

  const admin = createAdminClient();
  const { error } = await admin.from("allowed_proxies").insert({ ip, label });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/security");
}

export async function removeAllowedIp(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "security");

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  await admin.from("allowed_proxies").delete().eq("id", id);

  revalidatePath("/admin/security");
}
