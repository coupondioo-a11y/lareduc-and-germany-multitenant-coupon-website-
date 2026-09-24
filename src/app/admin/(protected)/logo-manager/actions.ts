"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "store-logos";

export async function uploadLogo(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "stores");

  const storeId = String(formData.get("store_id") ?? "");
  const file = formData.get("file");
  if (!storeId || !(file instanceof File)) throw new Error("Fichier manquant");

  const bytes = await file.arrayBuffer();
  // Resize-time, not read-time -- re-encoding on every page view would be far more work.
  const webp = await sharp(Buffer.from(bytes))
    .resize({ width: 760, height: 760, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const admin = createAdminClient();
  const path = `${storeId}.webp`;

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, webp, {
    contentType: "image/webp",
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicUrl } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { error } = await admin
    .from("stores")
    .update({
      logo_url: `${publicUrl.publicUrl}?v=${Date.now()}`,
      logo_source: "upload",
      logo_imported_at: new Date().toISOString(),
    })
    .eq("id", storeId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/logo-manager/${storeId}`);
}
