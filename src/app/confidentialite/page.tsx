import type { Metadata } from "next";
import { getSiteContext } from "@/lib/site-context";

export const metadata: Metadata = { title: "Politique de confidentialité" };

const MISSING = "à compléter";

export default async function ConfidentialitePage() {
  const site = await getSiteContext();

  return (
    <div className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl text-ink">Politique de confidentialité</h1>
      <p className="mt-3 text-[13px] text-ink-soft">
        Conforme au Règlement Général sur la Protection des Données (RGPD).
      </p>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Responsable du traitement</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {site.operatorName ?? MISSING}, {site.operatorAddress ?? MISSING}. Contact :{" "}
          {site.dpoEmail ?? MISSING}.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Données collectées</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink-soft">
          <li>
            <strong className="text-ink">Mesure d&apos;audience (Google Analytics)</strong> — activée
            uniquement après votre consentement explicite, via notre bandeau cookies (Consent Mode v2).
            Vous pouvez retirer ce consentement à tout moment en effaçant les cookies de ce site.
          </li>
          <li>
            <strong className="text-ink">Suivi d&apos;affiliation</strong> — un identifiant de clic est
            transmis au marchand lorsque vous suivez un lien affilié, afin de calculer notre commission.
            Aucune donnée personnelle n&apos;est partagée avec le réseau d&apos;affiliation dans ce
            processus.
          </li>
          <li>
            <strong className="text-ink">Notifications push</strong> — si vous activez les alertes, votre
            navigateur nous transmet un identifiant d&apos;abonnement (endpoint) permettant de vous
            envoyer des notifications. Vous pouvez désactiver les notifications depuis les réglages de
            votre navigateur à tout moment.
          </li>
          <li>
            <strong className="text-ink">Newsletter</strong> — votre adresse e-mail est conservée
            uniquement pour l&apos;envoi de nos e-mails, jusqu&apos;à votre désinscription.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Durée de conservation</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Le consentement aux cookies de mesure d&apos;audience est conservé 13 mois. Les données
          d&apos;abonnement à la newsletter et aux notifications push sont conservées jusqu&apos;à votre
          désinscription.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Vos droits</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de
          suppression de vos données. Pour l&apos;exercer, contactez {site.dpoEmail ?? MISSING}.
        </p>
      </section>
    </div>
  );
}
