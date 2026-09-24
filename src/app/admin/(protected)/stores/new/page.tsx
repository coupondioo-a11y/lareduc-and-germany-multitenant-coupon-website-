import { addStoreManually } from "./actions";

export default function NewStorePage() {
  return (
    <div className="max-w-lg">
      <h1 className="mb-2 text-lg font-semibold">Ajouter une boutique</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Entrez le domaine de la boutique. Le système cherche une page de codes promo pour cette
        boutique sur les sites concurrents configurés (Auto-Add), en extrait les offres, et DeepSeek
        les reformule dans un style original avant de les enregistrer. Laissez l&apos;URL source vide
        pour une recherche automatique, ou collez-la directement si vous la connaissez déjà.
      </p>
      <form action={addStoreManually} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Domaine de la boutique
          <input
            name="domain"
            placeholder="https://miin-cosmetics.com/"
            required
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Nom (optionnel, déduit du domaine sinon)
          <input name="name" placeholder="Miin Cosmetics" className="rounded border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          URL de la page concurrente source (optionnel)
          <input
            name="source_url"
            placeholder="https://www.bravopromo.fr/code-promo-miin.html"
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <button type="submit" className="mt-2 w-fit rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Ajouter et importer les offres
        </button>
      </form>
    </div>
  );
}
