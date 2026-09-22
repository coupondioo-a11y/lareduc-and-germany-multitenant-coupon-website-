/** Models emit markdown despite instructions not to. Strip it at write time and again at render time. */
export function stripMarkdown(value) {
  if (typeof value !== "string") return value;
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`{1,3}(.+?)`{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\*/g, "");
}

export function stripMarkdownDeep(value) {
  if (typeof value === "string") return stripMarkdown(value);
  if (Array.isArray(value)) return value.map(stripMarkdownDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripMarkdownDeep(v)]));
  }
  return value;
}
