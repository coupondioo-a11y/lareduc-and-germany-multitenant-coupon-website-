/**
 * UI-chrome strings only — labels, buttons, static copy shown on every page.
 * Per-store content (descriptions, FAQs, reviews) is authored/generated in
 * sites.language and lives in the DB, not here.
 *
 * Every language file is typed against this interface, so adding a language
 * without a key fails `tsc` instead of relying on review discipline.
 */
export interface Dictionary {
  nav: {
    allStores: string;
    categories: string;
    blog: string;
    search: string;
  };
  common: {
    getCode: string;
    viewOffer: string;
    copyCode: string;
    codeCopied: string;
    noCodeRequired: string;
    verified: string;
    expires: string;
    freeShipping: string;
  };
  storePage: {
    visitStore: string;
    similarStores: string;
    aboutStore: string;
    frequentlyAsked: string;
    reviews: string;
    writeReview: string;
  };
  couponCard: {
    code: string;
    deal: string;
    used: string;
    exclusive: string;
  };
  couponReveal: {
    openedInPreviousTab: string;
    copyAndGo: string;
    seeOffer: string;
  };
  newsletter: {
    heading: string;
    placeholder: string;
    subscribe: string;
    success: string;
  };
  footer: {
    legalNotice: string;
    privacyPolicy: string;
    contact: string;
    affiliateDisclosure: string;
  };
  cookieBanner: {
    message: string;
    acceptAll: string;
    rejectAll: string;
    customize: string;
  };
}
