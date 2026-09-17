const eurFmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const numFmt = new Intl.NumberFormat("fr-FR");

export const eur = (n: number) => eurFmt.format(n);
export const num = (n: number) => numFmt.format(n);

export function dateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

export function dateFrShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Teases a code on the reveal button without giving it away: SOLDE50 -> ••50 */
export function maskCode(code: string): string {
  return `••${code.slice(-2)}`;
}
