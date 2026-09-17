import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StoreLogo } from "@/components/StoreLogo";
import { stores } from "@/lib/fixtures";
import { num } from "@/lib/format";

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const L = letter.toUpperCase();
  return {
    title: `Magasins en ${L}`,
    description: `Tous les magasins et enseignes commençant par la lettre ${L}, avec leurs codes promo vérifiés.`,
  };
}

export default async function AllStoresLetterPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter: rawLetter } = await params;
  const letter = rawLetter.toLowerCase();
  if (!LETTERS.includes(letter)) notFound();

  const matches = stores
    .filter((s) => s.name.toLowerCase().startsWith(letter))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
      <nav aria-label="Fil d'Ariane" className="text-[13px] text-ink-soft">
        <Link href="/" className="hover:text-ink">Accueil</Link>
        <span aria-hidden> / </span>
        <span className="text-ink">Tous les magasins</span>
      </nav>

      <h1 className="mt-4 font-serif text-3xl text-ink sm:text-4xl">
        Magasins en {letter.toUpperCase()}
      </h1>

      <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Parcourir par lettre">
        {LETTERS.map((l) => {
          const active = l === letter;
          return (
            <li key={l}>
              <Link
                href={`/all-stores/${l}/`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-card border text-sm uppercase transition-colors duration-200 ${
                  active
                    ? "border-primary bg-primary text-primary-ink"
                    : "border-hair text-ink-soft hover:text-ink"
                }`}
              >
                {l}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        {matches.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {matches.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/store/${s.slug}/`}
                  className="flex items-center gap-3 rounded-card border border-hair p-3 transition-colors duration-200 hover:bg-surface"
                >
                  <StoreLogo name={s.name} size={44} />
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{s.name}</span>
                    <span className="block text-[13px] text-ink-soft">
                      {s.couponCount} codes · {num(s.clicksThisMonth)} visiteurs / mois
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[15px] text-ink-soft">
            Aucun magasin en {letter.toUpperCase()} pour le moment. La synchronisation des réseaux
            d&apos;affiliation en ajoute chaque jour.
          </p>
        )}
      </div>
    </div>
  );
}
