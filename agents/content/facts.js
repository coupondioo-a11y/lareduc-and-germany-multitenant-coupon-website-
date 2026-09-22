/** Ground every prompt in real facts pulled from the DB -- never let the model invent numbers. */
export async function gatherStoreFacts(supabase, store) {
  const { data: coupons } = await supabase
    .from("coupons")
    .select("title, type, code, discount_value")
    .eq("store_id", store.id)
    .eq("is_active", true);

  const rows = coupons ?? [];
  const withCode = rows.filter((c) => c.type === "code" && c.code);
  const best = rows.find((c) => c.discount_value)?.discount_value ?? null;

  return {
    name: store.name,
    activeOffers: rows.length,
    activeCodes: withCode.length,
    bestDiscount: best,
    exampleTitles: rows.slice(0, 5).map((c) => c.title),
  };
}

export function factsBlock(facts) {
  return [
    `Boutique : ${facts.name}`,
    `Offres actives listées : ${facts.activeOffers}`,
    `Codes promo actifs : ${facts.activeCodes}`,
    `Meilleure réduction actuelle : ${facts.bestDiscount ?? "non communiquée"}`,
    `Exemples d'offres : ${facts.exampleTitles.join(" / ") || "aucun"}`,
  ].join("\n");
}
