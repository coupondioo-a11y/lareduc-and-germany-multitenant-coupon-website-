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
  /** DB uuid. Optional so dev fixtures (which have no real row) still satisfy this type. */
  id?: string;
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
  affiliateUrl: string;
  logoUrl?: string | null;
  brand: { bg: string; ink: string };
  content?: StoreContent;
}
