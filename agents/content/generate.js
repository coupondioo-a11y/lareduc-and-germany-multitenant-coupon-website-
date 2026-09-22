import { factsBlock } from "./facts.js";
import { stripMarkdownDeep } from "./sanitize.js";

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const BANNED_PHRASES = [
  "incroyable",
  "révolutionnaire",
  "dans le monde d'aujourd'hui",
  "il est important de noter",
  "n'hésitez pas",
  "en un clin d'œil",
];

function stripFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

async function deepseekJson(systemPrompt, userPrompt) {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek call failed with ${res.status}`);
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  return JSON.parse(stripFences(raw));
}

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

/** Single call covering the full StoreContent shape -- one well-structured schema beats two API round trips. */
export async function generateStoreContent(facts) {
  const parsed = await deepseekJson(CONTENT_SYSTEM, factsBlock(facts));
  return stripMarkdownDeep(parsed);
}

const REVIEW_SYSTEM = `Tu écris 3 avis clients réalistes et variés (en français) pour une boutique, à partir de faits réels. Les avis doivent être crédibles, avec des détails concrets (code utilisé, délai de livraison), sans jamais inventer de faits contredisant ceux fournis. Réponds UNIQUEMENT avec un tableau JSON :
[{ "author": "prénom + initiale", "rating": 4 ou 5, "body": "string, 2-3 phrases" }]`;

const FALLBACK_REVIEWS = [
  { author: "Camille D.", rating: 5, body: "Le code fonctionne, livraison rapide, rien à redire." },
  { author: "Thomas L.", rating: 4, body: "Bon plan trouvé ici, la réduction s'est bien appliquée au paiement." },
  { author: "Nadia B.", rating: 4, body: "Site fiable, les offres listées sont à jour." },
];

export async function generateReviews(facts) {
  try {
    const parsed = await deepseekJson(REVIEW_SYSTEM, factsBlock(facts));
    if (Array.isArray(parsed) && parsed.length > 0) return stripMarkdownDeep(parsed);
  } catch {
    // API down or key missing -- fall through to the static pool.
  }
  return FALLBACK_REVIEWS;
}
