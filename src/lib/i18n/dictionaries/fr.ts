import type { Dictionary } from "../types";

const dict = {
  nav: {
    allStores: "Toutes les boutiques",
    categories: "Catégories",
    blog: "Blog",
    search: "Rechercher une boutique",
  },
  common: {
    getCode: "Voir le code",
    viewOffer: "Voir l'offre",
    copyCode: "Copier le code",
    codeCopied: "Code copié",
    noCodeRequired: "Aucun code requis",
    verified: "Vérifié",
    expires: "Expire le",
    freeShipping: "Livraison gratuite",
  },
  storePage: {
    visitStore: "Visiter la boutique",
    similarStores: "Boutiques similaires",
    aboutStore: "À propos",
    frequentlyAsked: "Questions fréquentes",
    reviews: "Avis clients",
    writeReview: "Laisser un avis",
  },
  couponCard: {
    code: "Code promo",
    deal: "Offre",
    used: "utilisations",
    exclusive: "Exclusif",
  },
  couponReveal: {
    openedInPreviousTab: "s'est ouverte dans l'onglet précédent",
    copyAndGo: "Copier & Aller à la boutique",
    seeOffer: "Voir l'offre",
  },
  newsletter: {
    heading: "Ne manquez plus aucun bon plan",
    placeholder: "Votre adresse e-mail",
    subscribe: "S'inscrire",
    success: "Inscription confirmée",
  },
  footer: {
    legalNotice: "Mentions légales",
    privacyPolicy: "Politique de confidentialité",
    contact: "Contact",
    affiliateDisclosure:
      "Certains liens de ce site sont des liens affiliés : nous pouvons percevoir une commission sans surcoût pour vous.",
  },
  cookieBanner: {
    message:
      "Nous utilisons des cookies pour mesurer l'audience et améliorer votre expérience.",
    acceptAll: "Tout accepter",
    rejectAll: "Tout refuser",
    customize: "Personnaliser",
  },
} satisfies Dictionary;

export default dict;
