import "server-only";
import { stripMarkdownDeep } from "@/lib/sanitize";

const FIRECRAWL_URL = "https://api.firecrawl.dev/v1";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

/** Store name from a domain when the admin doesn't type one: "miin-cosmetics.com" -> "Miin Cosmetics". */
export function nameFromDomain(domain: string): string {
  const bare = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const base = bare.replace(/\.[a-z]{2,}$/i, "");
  return base
    .split(/[-.]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Find a competitor coupon page for this store by searching each configured domain, e.g. "miin site:bravopromo.fr". */
export async function discoverSourceUrl(storeName: string, domains: string[]): Promise<string | null> {
  for (const domain of domains) {
    const res = await fetch(`${FIRECRAWL_URL}/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: `${storeName} code promo site:${domain}`, limit: 3 }),
    });
    if (!res.ok) continue;
    const data = await res.json();
    const hit = data.data?.[0]?.url;
    if (hit) return hit;
  }
  return null;
}

export async function scrapeUrl(url: string): Promise<string> {
  const res = await fetch(`${FIRECRAWL_URL}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });
  if (!res.ok) throw new Error(`scrape(${url}) failed with ${res.status}`);
  const data = await res.json();
  return data.data?.markdown ?? "";
}

interface ExtractedCoupon {
  title: string;
  code: string | null;
  type: "code" | "deal" | "free_shipping";
  discountValue: string | null;
}

const EXTRACT_SYSTEM = `Tu extrais les offres et codes promo d'une page concurrente pour une boutique donnée, puis tu les RÉÉCRIS dans un style original.
Règles :
- Ne copie JAMAIS les phrases source mot pour mot -- reformule chaque titre d'offre avec tes propres mots (contenu dupliqué = pénalité SEO).
- Ne garde le code promo EXACT que s'il apparaît littéralement dans le texte source ; sinon "code": null et "type": "deal".
- N'invente aucune réduction non présente dans le texte source.
- Texte brut uniquement, jamais de markdown.
Réponds UNIQUEMENT avec un JSON valide :
{ "coupons": [{ "title": "string (reformulé)", "code": "string ou null", "type": "code|deal|free_shipping", "discountValue": "string ou null" }] }`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function extractAndHumanize(markdown: string, storeName: string): Promise<ExtractedCoupon[]> {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: EXTRACT_SYSTEM },
        { role: "user", content: `Boutique : ${storeName}\n\n${markdown.slice(0, 8000)}` },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek call failed with ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const parsed = stripMarkdownDeep(JSON.parse(stripFences(raw)));
  return Array.isArray(parsed.coupons) ? parsed.coupons : [];
}
