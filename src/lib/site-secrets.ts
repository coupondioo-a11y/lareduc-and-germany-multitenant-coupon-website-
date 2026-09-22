import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getVapidKeys(siteId: string): Promise<{ publicKey: string; privateKey: string } | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_secrets")
    .select("vapid_public, vapid_private")
    .eq("site_id", siteId)
    .maybeSingle();

  if (!data?.vapid_public || !data?.vapid_private) return null;
  return { publicKey: data.vapid_public, privateKey: data.vapid_private };
}
