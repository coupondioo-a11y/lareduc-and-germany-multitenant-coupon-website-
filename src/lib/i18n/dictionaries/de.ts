import type { Dictionary } from "../types";

/**
 * Germany isn't in scope until Phase 9, but the dictionary exists now so the
 * `satisfies Dictionary` check proves the contract works before it's load-bearing.
 */
const dict = {
  nav: {
    allStores: "Alle Shops",
    categories: "Kategorien",
    blog: "Blog",
    search: "Shop suchen",
  },
  common: {
    getCode: "Code anzeigen",
    viewOffer: "Angebot ansehen",
    copyCode: "Code kopieren",
    codeCopied: "Code kopiert",
    noCodeRequired: "Kein Code erforderlich",
    verified: "Geprüft",
    expires: "Gültig bis",
    freeShipping: "Kostenloser Versand",
  },
  storePage: {
    visitStore: "Shop besuchen",
    similarStores: "Ähnliche Shops",
    aboutStore: "Über den Shop",
    frequentlyAsked: "Häufige Fragen",
    reviews: "Bewertungen",
    writeReview: "Bewertung schreiben",
  },
  couponCard: {
    code: "Gutscheincode",
    deal: "Angebot",
    used: "Mal verwendet",
    exclusive: "Exklusiv",
  },
  couponReveal: {
    openedInPreviousTab: "wurde im vorherigen Tab geöffnet",
    copyAndGo: "Kopieren & zum Shop",
    seeOffer: "Angebot ansehen",
  },
  newsletter: {
    heading: "Verpassen Sie keine Angebote mehr",
    placeholder: "Ihre E-Mail-Adresse",
    subscribe: "Anmelden",
    success: "Anmeldung bestätigt",
  },
  footer: {
    legalNotice: "Impressum",
    privacyPolicy: "Datenschutzerklärung",
    contact: "Kontakt",
    affiliateDisclosure:
      "Einige Links auf dieser Seite sind Affiliate-Links: Wir erhalten ggf. eine Provision, ohne Mehrkosten für Sie.",
  },
  cookieBanner: {
    message:
      "Wir verwenden Cookies, um die Nutzung zu analysieren und Ihre Erfahrung zu verbessern.",
    acceptAll: "Alle akzeptieren",
    rejectAll: "Alle ablehnen",
    customize: "Anpassen",
  },
} satisfies Dictionary;

export default dict;
