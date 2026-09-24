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

/** Every content table has site_id ... on delete cascade, so this is a clean cut, not an orphan-leaving one. */
export async function deleteSite(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "security");

  const siteId = String(formData.get("siteId") ?? "");
  const confirmCode = String(formData.get("confirmCode") ?? "").trim().toUpperCase();

  const admin = createAdminClient();
  const { data: site } = await admin.from("sites").select("country_code").eq("id", siteId).maybeSingle();
  if (!site) throw new Error("Site introuvable");
  if (site.country_code !== confirmCode) {
    throw new Error(`Tapez ${site.country_code} pour confirmer la suppression`);
  }

  await admin.from("sites").delete().eq("id", siteId);

  const cookieStore = await cookies();
  if (cookieStore.get("admin_site_id")?.value === siteId) {
    cookieStore.delete("admin_site_id");
  }

  redirect("/admin/sites");
}

export async function updateSiteVerification(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "security");

  const siteId = String(formData.get("siteId") ?? "");
  const admin = createAdminClient();
  const { error } = await admin
    .from("sites")
    .update({
      ga_measurement_id: String(formData.get("ga_measurement_id") ?? "").trim() || null,
      gsc_verification: String(formData.get("gsc_verification") ?? "").trim() || null,
    })
    .eq("id", siteId);

  if (error) throw new Error(error.message);
  redirect("/admin/sites");
}

export async function sendTestPush(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "push_notifications");

  const siteId = String(formData.get("siteId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!siteId || !title || !body) throw new Error("Champs requis manquants");

  const admin = createAdminClient();
  const { data: secrets } = await admin
    .from("site_secrets")
    .select("vapid_public, vapid_private")
    .eq("site_id", siteId)
    .maybeSingle();

  if (!secrets?.vapid_public || !secrets?.vapid_private) {
    throw new Error("Aucune clé VAPID pour ce site");
  }

  webpush.setVapidDetails("mailto:admin@example.com", secrets.vapid_public, secrets.vapid_private);

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("site_id", siteId);

  let sent = 0;
  for (const sub of subscriptions ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body })
      );
      sent += 1;
    } catch (err) {
      // 404/410 = the browser dropped the subscription -- clean it up rather than retry forever.
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }

  await admin.from("push_notifications_log").insert({
    site_id: siteId,
    title,
    body,
    sent_count: sent,
    sent_by: profile!.id,
  });

  redirect("/admin/push");
}
