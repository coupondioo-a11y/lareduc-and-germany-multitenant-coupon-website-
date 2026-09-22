/**
 * Deterministic placeholder brand color, until the Logo Manager (see
 * BrandMark.tsx) serves a real logo. Same store name always -> same color,
 * no DB column needed for what's a purely presentational fallback.
 */
export function brandColorFor(name: string): { bg: string; ink: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return { bg: `hsl(${hue}, 55%, 30%)`, ink: "#FFFFFF" };
}
