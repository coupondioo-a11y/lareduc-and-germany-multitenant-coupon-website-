import Link from "next/link";

export const PAGE_SIZE = 50;

/** Keeps the current search/filter params when moving between pages. */
export function Pagination({
  basePath,
  params,
  page,
  total,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
      <span>
        Page {page} / {pages}
      </span>
      <span className="flex gap-3">
        {page > 1 ? (
          <Link href={href(page - 1)} className="text-orange-700 hover:underline">
            ← Précédent
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className="text-orange-700 hover:underline">
            Suivant →
          </Link>
        ) : null}
      </span>
    </div>
  );
}

export function cleanQuery(q: string | undefined): string {
  return (q ?? "").replace(/[%,()*\\]/g, " ").trim();
}
