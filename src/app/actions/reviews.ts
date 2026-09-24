"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function submitReview(siteId: string, storeId: string, author: string, rating: number, body: string) {
  if (!author.trim() || !body.trim() || rating < 1 || rating > 5) return { ok: false };

  const admin = createAdminClient();
  const { error } = await admin.from("store_reviews").insert({
    site_id: siteId,
    store_id: storeId,
    author_name: author.trim().slice(0, 40),
    rating,
    body: body.trim().slice(0, 1200),
    is_approved: false,
    is_seeded: false,
  });

  return { ok: !error };
}
