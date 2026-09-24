import { createPost } from "../actions";
import { BlogForm } from "../BlogForm";

export default function NewBlogPostPage() {
  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Nouvel article</h1>
      <BlogForm action={createPost} />
    </div>
  );
}
