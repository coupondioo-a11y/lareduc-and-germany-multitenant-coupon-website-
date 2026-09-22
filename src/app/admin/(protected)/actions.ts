"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import webpush from "web-push";
import { getCurrentAdminProfile, requirePermission } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setActiveSite(formData: FormData) {
  const siteId = formData.get("siteId");
  if (typeof siteId === "string" && siteId) {
    const cookieStore = await cookies();
    cookieStore.set("admin_site_id", siteId, { httpOnly: true, sameSite: "lax", path: "/" });
  }
}

/**
 * "Add country": insert a sites row + a fresh VAPID keypair in site_secrets.
 * Gated on 'security' — the highest-trust existing permission; adding a
 * country is structural, not day-to-day content work.
 */
export async function createSite(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "security");

  const countryCode = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const primaryDomain = String(formData.get("primaryDomain") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim();
  const locale = String(formData.get("locale") ?? "").trim();
  const storeSlugPattern = String(formData.get("storeSlugPattern") ?? "").trim() || "code-promo-{store}";

  if (!countryCode || !primaryDomain || !brandName || !language || !locale) {
    throw new Error("Champs requis manquants");
  }

  const admin = createAdminClient();

  const { data: site, error: siteError } = await admin
    .from("sites")
    .insert({
      country_code: countryCode,
      primary_domain: primaryDomain,
      brand_name: brandName,
      language,
      locale,
      store_slug_pattern: storeSlugPattern,
      site_url: `https://${primaryDomain}`,
    })
    .select("id")
    .single();

  if (siteError) throw new Error(siteError.message);

  const vapidKeys = webpush.generateVAPIDKeys();
  const { error: secretsError } = await admin.from("site_secrets").insert({
    site_id: site.id,
    vapid_public: vapidKeys.publicKey,
    vapid_private: vapidKeys.privateKey,
  });

  if (secretsError) throw new Error(secretsError.message);

  redirect("/admin/sites");
}
