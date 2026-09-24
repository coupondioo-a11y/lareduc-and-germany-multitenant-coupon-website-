import "server-only";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** The site the admin UI's site switcher currently has selected. */
export async function getActiveSiteId(): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get("admin_site_id")?.value;
  if (fromCookie) return fromCookie;

  const admin = createAdminClient();
  const { data } = await admin.from("sites").select("id").order("country_code").limit(1).maybeSingle();
  if (!data) throw new Error("No sites exist yet");
  return data.id;
}
