/** Repairs markdown that reached the DB despite the generation-time strip -- render-time is not optional. */
export function stripMarkdown(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`{1,3}(.+?)`{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*/g, "");
}

export function stripMarkdownDeep<T>(value: T): T {
  if (typeof value === "string") return stripMarkdown(value) as unknown as T;
  if (Array.isArray(value)) return value.map(stripMarkdownDeep) as unknown as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripMarkdownDeep(v)])
    ) as T;
  }
  return value;
}
