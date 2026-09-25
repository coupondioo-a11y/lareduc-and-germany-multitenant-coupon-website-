import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PromoCardGrid } from "@/components/PromoCardGrid";
import { getSiteContext } from "@/lib/site-context";
import { getEventBySlug, getEventItems } from "@/lib/db/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteContext();
  const event = await getEventBySlug(site.id, slug);
  if (!event) return {};
  return {
    title: event.name,
    description: event.description ?? `${event.name} : toutes les offres et codes promo sélectionnés.`,
    alternates: { canonical: `${site.siteUrl}/special/${event.slug}/` },
  };
}

export default async function SpecialEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteContext();
  const event = await getEventBySlug(site.id, slug);
  if (!event) notFound();

  const items = await getEventItems(site.id, event.id);

  return (
    <div className="glass-stage">
      <div className="mx-auto max-w-shell px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold text-ink sm:text-4xl">{event.name}</h1>
        {event.description ? <p className="mt-3 max-w-2xl text-[15px] text-ink-soft">{event.description}</p> : null}
        <div className="mt-8">
          {items.length > 0 ? (
            <PromoCardGrid items={items} />
          ) : (
            <p className="text-[15px] text-ink-soft">Les offres de cet événement arrivent bientôt.</p>
          )}
        </div>
      </div>
    </div>
  );
}
