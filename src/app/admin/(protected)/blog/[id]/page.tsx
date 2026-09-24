import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePost } from "../actions";
import { BlogForm } from "../BlogForm";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();
  const { data: post } = await admin
    .from("blog_posts")
    .select("id, title, excerpt, body, is_published")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Modifier l&apos;article</h1>
      <BlogForm action={updatePost} post={post} />
    </div>
  );
}
