"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, getCurrentAdminProfile } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSiteId } from "@/lib/admin-site";

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  return {
    title,
    slug: slugify(title),
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    is_published: formData.get("is_published") === "on",
  };
}

export async function createPost(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const siteId = await getActiveSiteId();
  const admin = createAdminClient();
  const values = fields(formData);
  const { error } = await admin.from("blog_posts").insert({
    site_id: siteId,
    ...values,
    published_at: values.is_published ? new Date().toISOString() : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function updatePost(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  const values = fields(formData);

  const { data: existing } = await admin.from("blog_posts").select("published_at").eq("id", id).maybeSingle();
  const { error } = await admin
    .from("blog_posts")
    .update({
      ...values,
      published_at: values.is_published ? existing?.published_at ?? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deletePost(formData: FormData) {
  const profile = await getCurrentAdminProfile();
  requirePermission(profile, "site_content");

  const admin = createAdminClient();
  await admin.from("blog_posts").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/admin/blog");
}
