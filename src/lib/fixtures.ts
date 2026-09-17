/**
 * Local fixture data for the frontend preview.
 * No database, no network sync yet — these rows stand in for what the
 * affiliate sync + auto-add scraper will populate from day one.
 *
 * `brand` replaces real logo assets for now: each store renders as a
 * colour block with its wordmark, the way the Logo Manager will later
 * render a real <=760px WebP through the CDN helper.
 */

export type CouponType = "code" | "deal" | "free_shipping";

export interface Coupon {
  id: string;
  /** Stable numeric id — the addressable /store/{slug}/{publicId}/ route. */
  publicId: number;
  storeSlug: string;
  title: string;
  type: CouponType;
  code?: string;
  discountValue?: string;
  minAmount?: string;
  verifiedAt: string;
  expiryDate?: string;
  isFeatured?: boolean;
  isExclusive?: boolean;
  usedCount: number;
  /** Per-offer outbound override; falls back to the store's affiliateUrl. */
  destinationUrl?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  body: string;
  createdAt: string;
  isSeeded?: boolean;
  helpful: number;
}

export interface StoreContent {
  description: string;
  h2Sections: { h2: string; body: string }[];
  faqs: { q: string; a: string }[];
  intelligenceBriefing: { intro: string; savingsAnalysis: string[]; insider: string };
  policies: { title: string; note: string }[];
  checkoutGuide: { intro: string; steps: string[] };
  expertGuide: { intro: string; sections: { h2: string; body: string }[] };
  proTips: string[];
}

export interface Store {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  blurb: string;
  couponCount: number;
  clicksThisMonth: number;
  rating: number;
  ratingCount: number;
  domain: string;
  /** Outbound tracking link for this store; a real network URL once synced. */
  affiliateUrl: string;
  brand: { bg: string; ink: string };
  content?: StoreContent;
}

export interface Banner {
  id: string;
  storeSlug: string;
  headline: string;
  figure: string;
  cta: string;
  from: string;
  to: string;
}

export const categories: { slug: string; name: string; storeCount: number }[] = [
  { slug: "mode", name: "Mode & Accessoires", storeCount: 412 },
  { slug: "maison", name: "Maison & Jardin", storeCount: 288 },
  { slug: "high-tech", name: "High-Tech", storeCount: 196 },
  { slug: "beaute", name: "Beauté & Parfum", storeCount: 174 },
  { slug: "voyage", name: "Voyage & Séjours", storeCount: 133 },
  { slug: "sport", name: "Sport & Plein air", storeCount: 151 },
  { slug: "enfants", name: "Enfants & Jouets", storeCount: 98 },
  { slug: "alimentation", name: "Alimentation & Vin", storeCount: 87 },
];

export const siteStats = {
  codesUsed: "12 millions",
  codesUsedNote: "Plus de 12 millions de codes utilisés par nos visiteurs.",
  saved: "34 millions",
  savedNote: "Nos utilisateurs ont économisé plus de 34 millions d'euros.",
  verified: "45 000 codes",
  verifiedNote: "45 000 offres vérifiées chaque mois par nos robots et notre équipe.",
  shopsListed: "7 210+",
  activeCodes: "31 377+",
  categoryCount: "52",
};

const storesRaw: Omit<Store, "affiliateUrl">[] = [
  {
    slug: "zalando",
    name: "Zalando",
    category: "Mode & Accessoires",
    categorySlug: "mode",
    blurb: "Vêtements, chaussures et accessoires de plus de 2 000 marques.",
    couponCount: 12,
    clicksThisMonth: 3204,
    rating: 4.3,
    ratingCount: 128,
    domain: "zalando.fr",
    brand: { bg: "#FF6900", ink: "#FFFFFF" },
    content: {
      description:
        "Zalando livre en France depuis 2012 et reste l'un des catalogues mode les plus larges du marché, avec un retour gratuit sous cent jours qui explique une bonne part de sa fidélité client. Les réductions passent surtout par des codes saisonniers et par l'outlet, où les démarques atteignent régulièrement 70 %. Nous revérifions chaque code de cette page chaque semaine et retirons ceux qui ne s'appliquent plus au panier.",
      h2Sections: [
        {
          h2: "Quand Zalando propose-t-il ses meilleures réductions ?",
          body: "Les deux temps forts sont les soldes d'hiver en janvier et les soldes d'été fin juin, prolongés par des ventes privées réservées aux membres Zalando Plus. En dehors de ces périodes, le Black Friday et les French Days concentrent les codes les plus généreux, souvent cumulables avec l'outlet.",
        },
        {
          h2: "Les codes sont-ils cumulables avec les articles déjà soldés ?",
          body: "Le plus souvent non : un code promo s'applique au prix courant et s'exclut des articles déjà démarqués. Font exception quelques codes « -10 % sur tout le panier » diffusés pendant les temps forts, qui fonctionnent alors sur les références soldées.",
        },
      ],
      faqs: [
        {
          q: "Comment utiliser un code promo Zalando ?",
          a: "Ajoutez vos articles au panier, ouvrez la page de paiement, puis collez le code dans le champ « Bon de réduction » avant de valider. La remise s'affiche immédiatement dans le récapitulatif.",
        },
        {
          q: "La livraison est-elle vraiment gratuite ?",
          a: "Oui, la livraison standard est offerte sans montant minimum, et le retour l'est également pendant cent jours.",
        },
        {
          q: "Que faire si mon code est refusé ?",
          a: "Vérifiez la date d'expiration et le montant minimum d'achat. La plupart des codes refusés le sont parce que le panier contient uniquement des articles déjà soldés.",
        },
      ],
      intelligenceBriefing: {
        intro:
          "Ce que révèlent les douze offres actuellement suivies pour Zalando, et comment en tirer la meilleure remise réelle.",
        savingsAnalysis: [
          "La remise médiane constatée sur les codes actifs est de 15 %, mais l'outlet fait grimper l'économie réelle à 40-55 % sur les fins de série.",
          "Les codes « première commande » à -15 % via l'application sont les plus rentables pour un premier achat supérieur à 80 €.",
          "Le port gratuit sans minimum rend les petits paniers intéressants, ce qui est rare dans la mode en ligne.",
        ],
        insider:
          "Placer les articles convoités dans le panier et attendre 48 h déclenche souvent un e-mail de relance avec un code personnalisé de -10 à -20 %.",
      },
      policies: [
        { title: "Livraison", note: "Standard offerte sans minimum, 3 à 5 jours ouvrés." },
        { title: "Retours", note: "Gratuits pendant 100 jours, étiquette prépayée incluse." },
        { title: "Remboursement", note: "Sous 5 à 10 jours après réception du retour." },
        { title: "Paiement", note: "Carte, PayPal, Klarna en 3 fois sans frais." },
        { title: "Service client", note: "Chat et e-mail 7j/7, de 7 h à 22 h." },
        { title: "Programme fidélité", note: "Zalando Plus : ventes en avance et livraison express." },
      ],
      checkoutGuide: {
        intro: "Quatre étapes pour appliquer une réduction sans mauvaise surprise au paiement.",
        steps: [
          "Constituez votre panier en vérifiant que les articles ne sont pas déjà soldés si le code cible le prix courant.",
          "Ouvrez « Voir le code » sur cette page et copiez le code affiché.",
          "Sur la page de paiement Zalando, collez-le dans le champ « Bon de réduction » et validez.",
          "Contrôlez la ligne de remise dans le récapitulatif avant de confirmer la commande.",
        ],
      },
      expertGuide: {
        intro:
          "Nos observations après un an de suivi des prix Zalando, pour acheter au bon moment plutôt qu'au premier code venu.",
        sections: [
          {
            h2: "Outlet ou code promo : lequel choisir ?",
            body: "Pour une pièce précise et récente, un code saisonnier reste la meilleure option car l'outlet ne référence que les fins de série. Pour un renouvellement de garde-robe sans marque imposée, l'outlet bat presque toujours les codes, surtout combiné au port gratuit.",
          },
          {
            h2: "Bien dimensionner sa commande",
            body: "Le retour étant gratuit et long, commander deux tailles d'une même référence est une pratique assumée par Zalando. Cela évite un second achat au prix fort si le code a expiré entre-temps.",
          },
        ],
      },
      proTips: [
        "Installez l'application : plusieurs codes -15 % sont réservés aux commandes mobiles.",
        "Créez une liste d'envies : Zalando notifie les baisses de prix sur les articles suivis.",
        "Regroupez vos achats en une commande : cela simplifie un éventuel retour groupé.",
      ],
    },
  },
  { slug: "sephora", name: "Sephora", category: "Beauté & Parfum", categorySlug: "beaute", blurb: "Parfums, maquillage et soin, avec un programme fidélité généreux.", couponCount: 8, clicksThisMonth: 2110, rating: 4.5, ratingCount: 96, domain: "sephora.fr", brand: { bg: "#000000", ink: "#FFFFFF" } },
  { slug: "nike", name: "Nike", category: "Sport & Plein air", categorySlug: "sport", blurb: "Chaussures et vêtements de sport, éditions membres et personnalisation.", couponCount: 6, clicksThisMonth: 2740, rating: 4.2, ratingCount: 71, domain: "nike.com", brand: { bg: "#111111", ink: "#FFFFFF" } },
  { slug: "fnac", name: "Fnac", category: "High-Tech", categorySlug: "high-tech", blurb: "Culture, informatique et électronique, retrait en magasin sous 1 h.", couponCount: 15, clicksThisMonth: 4025, rating: 4.1, ratingCount: 143, domain: "fnac.com", brand: { bg: "#E1A925", ink: "#111111" } },
  { slug: "asos", name: "ASOS", category: "Mode & Accessoires", categorySlug: "mode", blurb: "Mode jeune, plus de 800 marques et une livraison le lendemain.", couponCount: 9, clicksThisMonth: 1890, rating: 4.0, ratingCount: 58, domain: "asos.fr", brand: { bg: "#1C1C1C", ink: "#FFFFFF" } },
  { slug: "cdiscount", name: "Cdiscount", category: "Maison & Jardin", categorySlug: "maison", blurb: "Généraliste français : maison, électroménager, high-tech et marketplace.", couponCount: 21, clicksThisMonth: 3560, rating: 3.9, ratingCount: 207, domain: "cdiscount.com", brand: { bg: "#0F3A8C", ink: "#FFFFFF" } },
  { slug: "leroy-merlin", name: "Leroy Merlin", category: "Maison & Jardin", categorySlug: "maison", blurb: "Bricolage, jardin et rénovation, retrait en une heure en magasin.", couponCount: 11, clicksThisMonth: 2980, rating: 4.2, ratingCount: 118, domain: "leroymerlin.fr", brand: { bg: "#78BE20", ink: "#111111" } },
  { slug: "uber-eats", name: "Uber Eats", category: "Alimentation & Vin", categorySlug: "alimentation", blurb: "Livraison de repas en moins de 30 minutes dans toute la France.", couponCount: 7, clicksThisMonth: 5120, rating: 4.0, ratingCount: 264, domain: "ubereats.com", brand: { bg: "#06C167", ink: "#06231A" } },
  { slug: "shein", name: "SHEIN", category: "Mode & Accessoires", categorySlug: "mode", blurb: "Mode à petits prix, nouveautés quotidiennes et application dédiée.", couponCount: 18, clicksThisMonth: 6340, rating: 3.7, ratingCount: 402, domain: "shein.com", brand: { bg: "#000000", ink: "#FFFFFF" } },
  { slug: "carrefour", name: "Carrefour", category: "Alimentation & Vin", categorySlug: "alimentation", blurb: "Courses en ligne, drive et livraison à domicile partout en France.", couponCount: 13, clicksThisMonth: 3110, rating: 4.0, ratingCount: 176, domain: "carrefour.fr", brand: { bg: "#004E9F", ink: "#FFFFFF" } },
  { slug: "samsung", name: "Samsung", category: "High-Tech", categorySlug: "high-tech", blurb: "Smartphones, téléviseurs et électroménager, offres de reprise incluses.", couponCount: 10, clicksThisMonth: 4480, rating: 4.3, ratingCount: 152, domain: "samsung.com", brand: { bg: "#0F2D8C", ink: "#FFFFFF" } },
  { slug: "eurostar", name: "Eurostar", category: "Voyage & Séjours", categorySlug: "voyage", blurb: "Trains directs Paris-Londres, Bruxelles et Amsterdam.", couponCount: 5, clicksThisMonth: 1620, rating: 4.1, ratingCount: 64, domain: "eurostar.com", brand: { bg: "#0B2C5E", ink: "#FFFFFF" } },
  { slug: "center-parcs", name: "Center Parcs", category: "Voyage & Séjours", categorySlug: "voyage", blurb: "Séjours en cottage et parcs aquatiques, réservables toute l'année.", couponCount: 6, clicksThisMonth: 1440, rating: 4.0, ratingCount: 88, domain: "centerparcs.fr", brand: { bg: "#00795C", ink: "#FFFFFF" } },
  { slug: "temu", name: "Temu", category: "Maison & Jardin", categorySlug: "maison", blurb: "Marketplace généraliste à très petits prix, livraison suivie.", couponCount: 24, clicksThisMonth: 7210, rating: 3.6, ratingCount: 512, domain: "temu.com", brand: { bg: "#FB7701", ink: "#FFFFFF" } },
  { slug: "aroma-zone", name: "Aroma-Zone", category: "Beauté & Parfum", categorySlug: "beaute", blurb: "Cosmétique maison, huiles essentielles et ingrédients naturels.", couponCount: 4, clicksThisMonth: 980, rating: 4.6, ratingCount: 133, domain: "aroma-zone.com", brand: { bg: "#5B7F3A", ink: "#FFFFFF" } },
  { slug: "mondial-relay", name: "Mondial Relay", category: "Maison & Jardin", categorySlug: "maison", blurb: "Expédition de colis en point relais à tarif réduit.", couponCount: 3, clicksThisMonth: 1210, rating: 3.8, ratingCount: 97, domain: "mondialrelay.fr", brand: { bg: "#C8102E", ink: "#FFFFFF" } },
];

// Real syncs (Awin/Kwanko/Effiliation) will populate a dedicated tracking
// link here; until then the merchant's own domain stands in for it.
export const stores: Store[] = storesRaw.map((s) => ({ ...s, affiliateUrl: `https://${s.domain}/` }));

export const heroBanners: Banner[] = [
  {
    id: "b1",
    storeSlug: "zalando",
    headline: "Soldes d'hiver : jusqu'à -50 % sur une sélection mode",
    figure: "-50 %",
    cta: "Code promo",
    from: "#FF8A3D",
    to: "#FFC46B",
  },
  {
    id: "b2",
    storeSlug: "uber-eats",
    headline: "15 € offerts sur vos deux premières commandes",
    figure: "15 €",
    cta: "Code promo",
    from: "#06C167",
    to: "#8BE8B4",
  },
  {
    id: "b3",
    storeSlug: "samsung",
    headline: "Jusqu'à 300 € de bonus reprise sur les Galaxy",
    figure: "300 €",
    cta: "Voir l'offre",
    from: "#1E3FA8",
    to: "#6E8FE8",
  },
];

// wp_post_id has no equivalent here — this is a fresh build with no legacy
// import ids, so publicId (assigned at creation) is the only coupon id.
const couponsRaw: Omit<Coupon, "publicId">[] = [
  { id: "z1", storeSlug: "zalando", title: "Soldes d'hiver : jusqu'à -50 % sur une sélection mode", type: "code", code: "SOLDE50", discountValue: "-50 %", minAmount: "Sans minimum", verifiedAt: "2026-09-08", expiryDate: "2026-09-30", isFeatured: true, isExclusive: true, usedCount: 1204 },
  { id: "z2", storeSlug: "zalando", title: "-10 % supplémentaires dès 60 € d'achat", type: "code", code: "ZAL10PLUS", discountValue: "-10 %", minAmount: "60 € minimum", verifiedAt: "2026-09-07", usedCount: 833 },
  { id: "z3", storeSlug: "zalando", title: "Livraison offerte sans montant minimum", type: "free_shipping", discountValue: "Port offert", minAmount: "Sans minimum", verifiedAt: "2026-09-06", usedCount: 512 },
  { id: "z4", storeSlug: "zalando", title: "Jusqu'à -70 % dans l'outlet permanent", type: "deal", discountValue: "-70 %", minAmount: "Sans minimum", verifiedAt: "2026-09-05", usedCount: 489 },
  { id: "z5", storeSlug: "zalando", title: "-15 % sur la première commande via l'application", type: "code", code: "APPLI15", discountValue: "-15 %", minAmount: "Sans minimum", verifiedAt: "2026-09-03", usedCount: 377 },

  { id: "s1", storeSlug: "sephora", title: "-20 % sur le soin visage dès 49 € d'achat", type: "code", code: "SOIN20", discountValue: "-20 %", minAmount: "49 € minimum", verifiedAt: "2026-09-08", isFeatured: true, isExclusive: true, usedCount: 641 },
  { id: "f1", storeSlug: "fnac", title: "30 € offerts dès 300 € sur le gros électroménager", type: "code", code: "MAISON30", discountValue: "30 €", minAmount: "300 € minimum", verifiedAt: "2026-09-08", usedCount: 902 },
  { id: "n1", storeSlug: "nike", title: "-25 % pour les membres sur les articles éligibles", type: "code", code: "MEMBRE25", discountValue: "-25 %", minAmount: "Sans minimum", verifiedAt: "2026-09-07", usedCount: 455 },
  { id: "c1", storeSlug: "cdiscount", title: "-15 € dès 149 € sur la maison et le jardin", type: "code", code: "JARDIN15", discountValue: "15 €", minAmount: "149 € minimum", verifiedAt: "2026-09-08", usedCount: 1188 },
  { id: "a1", storeSlug: "asos", title: "-15 % sur tout le site, articles soldés inclus", type: "code", code: "ASOS15", discountValue: "-15 %", minAmount: "Sans minimum", verifiedAt: "2026-09-06", isExclusive: true, usedCount: 528 },
  { id: "lm1", storeSlug: "leroy-merlin", title: "10 € de remise sur tous les achats via l'appli", type: "code", code: "APPLI10", discountValue: "10 €", minAmount: "100 € minimum", verifiedAt: "2026-09-08", usedCount: 741 },
  { id: "ue1", storeSlug: "uber-eats", title: "15 € offerts sur vos deux premières commandes", type: "code", code: "BIENVENUE15", discountValue: "15 €", minAmount: "20 € minimum", verifiedAt: "2026-09-08", isFeatured: true, usedCount: 1976 },
  { id: "sh1", storeSlug: "shein", title: "-15 % en commandant depuis l'application", type: "code", code: "SHEINAPP", discountValue: "-15 %", minAmount: "Sans minimum", verifiedAt: "2026-09-07", usedCount: 2044 },
  { id: "ca1", storeSlug: "carrefour", title: "20 € de remise sur votre première commande drive", type: "code", code: "DRIVE20", discountValue: "20 €", minAmount: "80 € minimum", verifiedAt: "2026-09-08", usedCount: 866 },
  { id: "sa1", storeSlug: "samsung", title: "Jusqu'à 300 € de bonus reprise sur les Galaxy", type: "deal", discountValue: "300 €", minAmount: "Sans minimum", verifiedAt: "2026-09-06", usedCount: 612 },
  { id: "eu1", storeSlug: "eurostar", title: "Jusqu'à -50 % sur une sélection de billets", type: "deal", discountValue: "-50 %", minAmount: "Sans minimum", verifiedAt: "2026-09-05", usedCount: 398 },
  { id: "cp1", storeSlug: "center-parcs", title: "-30 % sur les séjours hors vacances scolaires", type: "code", code: "SEJOUR30", discountValue: "-30 %", minAmount: "Sans minimum", verifiedAt: "2026-09-07", usedCount: 434 },
  { id: "te1", storeSlug: "temu", title: "-40 % sur la maison et la décoration", type: "code", code: "MAISON40", discountValue: "-40 %", minAmount: "Sans minimum", verifiedAt: "2026-09-08", usedCount: 3120 },
  { id: "az1", storeSlug: "aroma-zone", title: "5 € de réduction en parrainant un ami", type: "code", code: "PARRAIN5", discountValue: "5 €", minAmount: "25 € minimum", verifiedAt: "2026-09-04", usedCount: 221 },
  { id: "mr1", storeSlug: "mondial-relay", title: "-10 % sur tous les envois avec ce code", type: "code", code: "ENVOI10", discountValue: "-10 %", minAmount: "Sans minimum", verifiedAt: "2026-09-08", isExclusive: true, usedCount: 517 },
];

export const coupons: Coupon[] = couponsRaw.map((c, i) => ({ ...c, publicId: 480001 + i }));

export const reviews: Record<string, Review[]> = {
  zalando: [
    { id: "r1", author: "Camille D.", rating: 5, body: "Code SOLDE50 appliqué sans problème sur une paire de baskets. Livraison en trois jours et retour d'un article trop grand remboursé en une semaine.", createdAt: "2026-07-18", helpful: 14 },
    { id: "r2", author: "Nadia B.", rating: 4, body: "Le code première commande n'a marché que depuis l'application, pas sur le site. Une fois la commande passée depuis mon téléphone, la remise était bien là.", createdAt: "2026-06-05", helpful: 9 },
    { id: "r3", author: "Thomas L.", rating: 4, body: "L'outlet est vraiment le bon plan, plus intéressant que les codes quand on n'a pas de marque précise en tête. Attention, les stocks partent vite.", createdAt: "2026-05-22", helpful: 6 },
    { id: "r4", author: "Julie M.", rating: 5, body: "Site fiable, je commande régulièrement et les codes de cette page sont à jour, ce qui n'est pas le cas partout.", createdAt: "2026-08-01", isSeeded: true, helpful: 3 },
  ],
};

export function getStore(slug: string): Store | undefined {
  return stores.find((s) => s.slug === slug);
}

/** Only what a coupon card needs — keeps long-form store content out of the client payload. */
export function cardStore({ slug, name, domain, affiliateUrl, brand }: Store) {
  return { slug, name, domain, affiliateUrl, brand };
}

export function couponsForStore(slug: string): Coupon[] {
  const rank = (c: Coupon) => (c.isFeatured ? 0 : 1);
  return coupons
    .filter((c) => c.storeSlug === slug)
    .sort((a, b) => rank(a) - rank(b) || b.usedCount - a.usedCount);
}

export function couponById(id: string): Coupon {
  const c = coupons.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown coupon fixture: ${id}`);
  return c;
}

export function couponByPublicId(publicId: number): Coupon | undefined {
  return coupons.find((c) => c.publicId === publicId);
}

export function realReviews(slug: string): Review[] {
  return (reviews[slug] ?? []).filter((r) => r.isSeeded !== true);
}

export function ratingFor(slug: string): { value: number; count: number } {
  const real = realReviews(slug);
  if (real.length === 0) return { value: 0, count: 0 };
  const value = real.reduce((s, r) => s + r.rating, 0) / real.length;
  return { value: Math.round(value * 10) / 10, count: real.length };
}
