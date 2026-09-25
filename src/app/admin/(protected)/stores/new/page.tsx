import Link from "next/link";
import { createStoreManual } from "./actions";
import { ErrorBanner } from "../../ErrorBanner";

export default async function NewStorePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-lg font-semibold">Ajouter une boutique (manuel)</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Création à la main, sans scraping. Pour que le système trouve les offres et rédige le contenu
        tout seul, utilisez{" "}
        <Link href="/admin/auto-add" className="text-orange-700 underline">
          Auto-Add
        </Link>
        .
      </p>
      <ErrorBanner code={error} />
      <form action={createStoreManual} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Nom
          <input name="name" required className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Domaine de la boutique
          <input name="domain" placeholder="miin-cosmetics.com" className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          URL affiliée (optionnel, sinon le domaine)
          <input name="affiliate_url" className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Description
          <textarea name="description" rows={3} className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <button type="submit" className="mt-2 w-fit rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Créer la boutique
        </button>
      </form>
    </div>
  );
}
