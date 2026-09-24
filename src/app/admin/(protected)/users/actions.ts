"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_PERMISSIONS } from "@/lib/admin-auth";

export async function createUser(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "users");

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const permissions = ADMIN_PERMISSIONS.filter((p) => formData.get(`perm_${p}`) === "on");

  if (!email || password.length < 8) throw new Error("Email et mot de passe (8+ caractères) requis");

  const admin = createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) throw new Error(authError.message);

  const { error } = await admin
    .from("admin_profiles")
    .insert({ id: created.user.id, email, permissions, is_active: true });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function updatePermissions(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "users");

  const id = String(formData.get("id") ?? "");
  const permissions = ADMIN_PERMISSIONS.filter((p) => formData.get(`perm_${p}`) === "on");

  const admin = createAdminClient();
  // UPDATE, never upsert -- admin_profiles.email is NOT NULL and upsert
  // would re-validate the whole insert arm even though the row exists.
  await admin.from("admin_profiles").update({ permissions }).eq("id", id);

  revalidatePath("/admin/users");
}

export async function toggleActive(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "users");

  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("is_active") === "true";

  if (id === profile!.id) throw new Error("Vous ne pouvez pas désactiver votre propre compte");

  const admin = createAdminClient();
  await admin.from("admin_profiles").update({ is_active: !isActive }).eq("id", id);

  revalidatePath("/admin/users");
}
