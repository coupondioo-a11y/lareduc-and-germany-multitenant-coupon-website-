import "server-only";
import { stripMarkdownDeep } from "@/lib/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StoreContent } from "@/lib/types";

/**
 * TS port of agents/content/{facts,generate}.js for admin-triggered
 * generation, which has to run inside a Next.js server action. The weekly
 * cron path stays in agents/ -- duplicating ~100 lines between a cron script
 * and a serverless function is simpler than a shared package across two
 * independently deployed runtimes.
 */

export const LANGUAGE_NAMES: Record<string, string> = {
  fr: "français",
  de: "allemand",
  es: "espagnol",
  en: "anglais",
  it: "italien",
};

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
    exampleTitles: rows.slice(0, 6).map((c) => c.title),
  };
}

function factsBlock(facts: StoreFacts, brandContext?: string): string {
  const lines = [
    `Boutique : ${facts.name}`,
    `Offres actives listées : ${facts.activeOffers}`,
    `Codes promo actifs : ${facts.activeCodes}`,
    `Meilleure réduction actuelle : ${facts.bestDiscount ?? "non communiquée"}`,
    `Exemples d'offres : ${facts.exampleTitles.join(" / ") || "aucun"}`,
  ];
  if (brandContext) {
    lines.push("", "Extrait du site officiel de la marque (source de faits sur la marque, à reformuler, jamais copier) :", brandContext);
  }
  return lines.join("\n");
}

const BANNED_PHRASES = [
  "incroyable",
  "révolutionnaire",
  "dans le monde d'aujourd'hui",
  "il est important de noter",
  "n'hésitez pas",
  "en un clin d'œil",
];

function contentSystem(language: string): string {
  const langName = LANGUAGE_NAMES[language] ?? language;
  return `Tu es rédacteur SEO pour un site de codes promo. Tu écris le contenu éditorial complet d'une page boutique, à partir de faits réels fournis. TOUT le contenu doit être rédigé en ${langName}. Règles :
- Utilise UNIQUEMENT les faits fournis (offres et extrait du site officiel). Ne promets jamais une réduction non confirmée. Si une information est inconnue (livraison, retours), reste prudent ("généralement", "sous réserve des conditions en vigueur") plutôt que d'inventer un chiffre.
- Optimisation SEO : place naturellement le nom de la boutique et l'expression "code promo" (dans la langue cible) dans les intertitres et les questions de la FAQ ; les FAQ répondent à de vraies requêtes de recherche (utiliser un code, cumul, livraison, retours, meilleur moment pour acheter). Pas de bourrage de mots-clés.
- Style humain : varie la longueur des phrases et la structure, ton de conseiller concret, aucune formule de remplissage.
- Texte brut uniquement. Jamais d'astérisques, dièses, backticks ou tirets de liste -- la page affiche les caractères littéralement et c'est illisible.
- Interdit d'utiliser ces tournures (ou leur équivalent dans la langue cible) : ${BANNED_PHRASES.join(", ")}.
Réponds UNIQUEMENT avec un objet JSON valide au format exact :
{
  "description": "string, 2-3 phrases (présentation de la boutique)",
  "h2Sections": [{ "h2": "string", "body": "string" }] (2 sections),
  "faqs": [{ "q": "string", "a": "string" }] (4 questions),
  "policies": [{ "title": "string", "note": "string" }] (4 entrées : livraison, retours, paiement, service client),
  "checkoutGuide": { "intro": "string", "steps": ["string"] } (4 étapes),
  "expertGuide": { "intro": "string", "sections": [{ "h2": "string", "body": "string" }] } (2 sections),
  "proTips": ["string"] (3 astuces),
  "intelligenceBriefing": { "intro": "string", "savingsAnalysis": ["string"] (2-3 points), "insider": "string" }
}`;
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

function validShape(content: Partial<StoreContent>): content is StoreContent {
  return (
    typeof content.description === "string" &&
    Array.isArray(content.policies) &&
    !!content.expertGuide?.sections?.length &&
    !!content.checkoutGuide?.steps?.length &&
    Array.isArray(content.faqs) &&
    content.faqs.length > 0
  );
}

export async function regenerateStoreContent(
  storeId: string,
  storeName: string,
  opts: { language?: string; brandContext?: string } = {}
): Promise<StoreContent> {
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
        { role: "system", content: contentSystem(opts.language ?? "fr") },
        { role: "user", content: factsBlock(facts, opts.brandContext) },
      ],
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek a répondu ${res.status}`);

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const parsed = stripMarkdownDeep(JSON.parse(stripFences(raw))) as Partial<StoreContent>;

  if (!validShape(parsed)) throw new Error("La réponse du modèle ne correspond pas au format attendu");
  return parsed;
}
