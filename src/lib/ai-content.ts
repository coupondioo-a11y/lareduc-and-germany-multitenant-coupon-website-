import "server-only";
import { stripMarkdownDeep } from "@/lib/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StoreContent } from "@/lib/types";

/**
 * TS port of agents/content/{facts,generate}.js for the admin's manual
 * "regenerate" button, which has to run inside a Next.js server action, not
 * the standalone agents/ package. The weekly-cron path stays in agents/ --
 * some duplication between a cron script and a serverless function is
 * simpler than sharing a package across two independently deployed runtimes.
 */

interface StoreFacts {
  name: string;
  activeOffers: number;
  activeCodes: number;
  bestDiscount: string | null;
  exampleTitles: string[];
}

async function gatherStoreFacts(storeId: string, storeName: string): Promise<StoreFacts> {
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("title, type, code, discount_value")
    .eq("store_id", storeId)
    .eq("is_active", true);

  const rows = coupons ?? [];
  const withCode = rows.filter((c) => c.type === "code" && c.code);
  const best = rows.find((c) => c.discount_value)?.discount_value ?? null;

  return {
    name: storeName,
    activeOffers: rows.length,
    activeCodes: withCode.length,
    bestDiscount: best,
    exampleTitles: rows.slice(0, 5).map((c) => c.title),
  };
}

function factsBlock(facts: StoreFacts): string {
  return [
    `Boutique : ${facts.name}`,
    `Offres actives listées : ${facts.activeOffers}`,
    `Codes promo actifs : ${facts.activeCodes}`,
    `Meilleure réduction actuelle : ${facts.bestDiscount ?? "non communiquée"}`,
    `Exemples d'offres : ${facts.exampleTitles.join(" / ") || "aucun"}`,
  ].join("\n");
}

const BANNED_PHRASES = [
  "incroyable",
  "révolutionnaire",
  "dans le monde d'aujourd'hui",
  "il est important de noter",
  "n'hésitez pas",
  "en un clin d'œil",
];

const CONTENT_SYSTEM = `Tu écris le contenu éditorial d'une page de codes promo française, à partir de faits réels fournis. Règles :
- Utilise UNIQUEMENT les faits fournis. Ne promets jamais une réduction non confirmée par les faits. Si une information est inconnue (livraison, retours), reste prudent ("généralement", "sous réserve des conditions en vigueur") plutôt que d'inventer un chiffre.
- Texte brut uniquement. Jamais d'astérisques, dièses, backticks ou tirets de liste -- la page affiche les caractères littéralement et c'est illisible.
- Interdit d'utiliser ces mots/tournures : ${BANNED_PHRASES.join(", ")}.
- Varie la longueur des phrases et la structure : ne pas appliquer un modèle identique à chaque boutique.
Réponds UNIQUEMENT avec un objet JSON valide au format exact :
{
  "description": "string, 2-3 phrases",
  "h2Sections": [{ "h2": "string", "body": "string" }] (2 sections),
  "faqs": [{ "q": "string", "a": "string" }] (3 questions),
  "policies": [{ "title": "string", "note": "string" }] (4 entrées : Livraison, Retours, Paiement, Service client),
  "checkoutGuide": { "intro": "string", "steps": ["string"] } (4 étapes),
  "expertGuide": { "intro": "string", "sections": [{ "h2": "string", "body": "string" }] } (2 sections),
  "proTips": ["string"] (3 astuces),
  "intelligenceBriefing": { "intro": "string", "savingsAnalysis": ["string"] (2-3 points), "insider": "string" }
}`;

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function validShape(content: Partial<StoreContent>): content is StoreContent {
  return (
    Array.isArray(content.policies) &&
    !!content.expertGuide?.sections?.length &&
    !!content.checkoutGuide?.steps?.length &&
    Array.isArray(content.faqs) &&
    content.faqs.length > 0
  );
}

export async function regenerateStoreContent(storeId: string, storeName: string): Promise<StoreContent> {
  const facts = await gatherStoreFacts(storeId, storeName);

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: CONTENT_SYSTEM },
        { role: "user", content: factsBlock(facts) },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek call failed with ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const parsed = stripMarkdownDeep(JSON.parse(stripFences(raw))) as Partial<StoreContent>;

  if (!validShape(parsed)) throw new Error("La réponse du modèle ne correspond pas au format attendu");
  return parsed;
}
