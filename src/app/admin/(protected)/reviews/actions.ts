"use server";

import { revalidatePath } from "next/cache";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function moderateReview(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "flagged"); // reviews has no dedicated permission in the documented 12-item list; closest is the other moderation-queue permission

  const id = String(formData.get("id") ?? "");
  const approve = formData.get("approve") === "true";
  const admin = createAdminClient();

  if (approve) {
    await admin.from("store_reviews").update({ is_approved: true }).eq("id", id);
  } else {
    await admin.from("store_reviews").delete().eq("id", id);
  }

  revalidatePath("/admin/reviews");
}
