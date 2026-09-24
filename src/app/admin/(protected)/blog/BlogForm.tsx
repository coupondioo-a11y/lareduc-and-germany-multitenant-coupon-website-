export function BlogForm({
  action,
  post,
}: {
  action: (formData: FormData) => void;
  post?: { id: string; title: string; excerpt: string | null; body: string | null; is_published: boolean };
}) {
  return (
    <form action={action} className="flex max-w-2xl flex-col gap-3">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}
      <label className="flex flex-col gap-1 text-sm">
        Titre
        <input name="title" defaultValue={post?.title} required className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Extrait
        <input name="excerpt" defaultValue={post?.excerpt ?? ""} className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contenu
        <textarea name="body" defaultValue={post?.body ?? ""} rows={10} className="rounded border border-neutral-300 px-3 py-2" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={post?.is_published} />
        Publié
      </label>
      <button type="submit" className="mt-2 w-fit rounded bg-neutral-900 px-3 py-2 text-sm text-white">
        Enregistrer
      </button>
    </form>
  );
}
