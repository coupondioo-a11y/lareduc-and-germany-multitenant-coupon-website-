import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const ADMIN_PERMISSIONS = [
  "stores",
  "coupons",
  "categories",
  "flagged",
  "automation",
  "auto_add",
  "users",
  "site_content",
  "seo_content",
  "newsletter",
  "push_notifications",
  "security",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export interface AdminProfile {
  id: string;
  email: string;
  permissions: AdminPermission[];
}

/** Session check + active-profile check. Returns null for either failure — fail closed. */
export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // admin_profiles has no anon RLS policy — only the service-role client can read it.
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_profiles")
    .select("id, email, permissions, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || data.is_active !== true) return null;

  return { id: data.id, email: data.email, permissions: data.permissions ?? [] };
}

export function hasPermission(profile: AdminProfile | null, permission: AdminPermission): boolean {
  return profile !== null && profile.permissions.includes(permission);
}

export function requirePermission(profile: AdminProfile | null, permission: AdminPermission): void {
  if (!hasPermission(profile, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}
