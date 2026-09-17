import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-shell px-4 py-24 sm:px-6">
      <p className="font-serif text-5xl text-ink">Page introuvable</p>
      <p className="mt-4 max-w-prose text-[15px] text-ink-soft">
        Le lien est peut-être ancien, ou le magasin n&apos;a pas encore été ajouté au catalogue.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-card bg-primary px-4 text-sm font-medium text-primary-ink"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
