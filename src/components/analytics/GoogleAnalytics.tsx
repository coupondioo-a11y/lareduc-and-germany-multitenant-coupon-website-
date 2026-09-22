"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const CONSENT_KEY = "consent_v1";
const CONSENT_MONTHS = 13;

type Consent = "granted" | "denied";

function readStoredConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: Consent; expiresAt: number };
    if (Date.now() > parsed.expiresAt) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function storeConsent(value: Consent) {
  try {
    const expiresAt = Date.now() + CONSENT_MONTHS * 30 * 24 * 3600 * 1000;
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ value, expiresAt }));
  } catch {
    // Private browsing / blocked storage -- consent just won't persist across visits.
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function applyConsent(value: Consent) {
  window.gtag?.("consent", "update", { analytics_storage: value, ad_storage: "denied" });
}

/** GA4 with Consent Mode v2 -- analytics denied by default until accepted, per french-market.md. */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    setConsent(readStoredConsent());
  }, []);

  useEffect(() => {
    if (consent) applyConsent(consent);
  }, [consent]);

  function handleChoice(value: Consent) {
    storeConsent(value);
    setConsent(value);
  }

  return (
    <>
      <Script
        id="ga-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied'});gtag('js',new Date());gtag('config','${measurementId}');`,
        }}
      />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />

      {consent === null ? (
        <div
          role="dialog"
          aria-label="Consentement cookies"
          className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-hair bg-paper p-4 shadow-lift sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-[13px] text-ink-soft">
            Nous utilisons des cookies de mesure d&apos;audience. Vous pouvez accepter ou refuser.
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => handleChoice("denied")}
              className="h-9 rounded-card border border-hair px-4 text-[13px] font-medium text-ink"
            >
              Refuser
            </button>
            <button
              type="button"
              onClick={() => handleChoice("granted")}
              className="h-9 rounded-card bg-primary px-4 text-[13px] font-medium text-primary-ink"
            >
              Accepter
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
