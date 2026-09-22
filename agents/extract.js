const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const PROMPT = `Tu extrais des données structurées d'une page de codes promo concurrente.
Réponds UNIQUEMENT avec un objet JSON valide, sans balises markdown, au format exact :
{
  "storeName": "string",
  "storeDomain": "string ou null (nom de domaine du marchand, ex: nike.com)",
  "coupons": [
    { "title": "string", "code": "string ou null", "type": "code|deal|free_shipping", "discountValue": "string ou null" }
  ]
}
Si la page ne contient pas de boutique ou de codes identifiables, réponds { "storeName": null, "storeDomain": null, "coupons": [] }.
N'invente jamais de code promo : si aucun code n'est visible dans le texte, mets "code": null et "type": "deal".`;

function stripFences(text) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

/** Stage 3: turn scraped markdown into a structured store + coupons payload. */
export async function extract(markdown) {
  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: PROMPT },
        // Truncated: extraction only needs the visible offers, not a full page dump.
        { role: "user", content: markdown.slice(0, 8000) },
      ],
      temperature: 0,
    }),
  });

  if (!res.ok) {
    throw new Error(`extract(): DeepSeek call failed with ${res.status}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(stripFences(raw));
    return {
      storeName: typeof parsed.storeName === "string" ? parsed.storeName : null,
      storeDomain: typeof parsed.storeDomain === "string" ? parsed.storeDomain : null,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
    };
  } catch {
    throw new Error(`extract(): model returned invalid JSON: ${raw.slice(0, 200)}`);
  }
}
