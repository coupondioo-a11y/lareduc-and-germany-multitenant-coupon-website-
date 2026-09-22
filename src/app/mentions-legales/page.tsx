import type { Metadata } from "next";
import { getSiteContext } from "@/lib/site-context";

export const metadata: Metadata = { title: "Mentions légales" };

const MISSING = "à compléter";

export default async function MentionsLegalesPage() {
  const site = await getSiteContext();

  return (
    <div className="mx-auto max-w-prose px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl text-ink">Mentions légales</h1>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Éditeur du site</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {site.operatorName ?? MISSING}
          <br />
          {site.operatorAddress ?? MISSING}
          <br />
          SIRET : {site.siret ?? MISSING}
          <br />
          Directeur de la publication : {site.publicationDirector ?? MISSING}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Hébergeur</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {site.hostName ?? MISSING}
          <br />
          {site.hostAddress ?? MISSING}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Contact</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Pour toute question relative aux données personnelles :{" "}
          {site.dpoEmail ?? MISSING}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl text-ink">Liens d&apos;affiliation</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          {site.brandName} contient des liens affiliés vers les sites marchands référencés. Un achat
          effectué après un clic peut nous rémunérer, sans surcoût pour vous. Cela n&apos;influence pas
          la vérification des codes présentés sur le site.
        </p>
      </section>
    </div>
  );
}
