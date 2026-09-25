"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { runImport } from "./actions";
import type { ImportResult } from "@/lib/store-import";

export function AddStoreForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await runImport(data));
      } catch (err) {
        setResult({ ok: false, steps: [], error: (err as Error).message });
      }
    });
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Domaine de la boutique
          <input
            name="domain"
            required
            placeholder="https://miin-cosmetics.com/"
            className="rounded border border-neutral-300 px-3 py-2"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Nom (optionnel)
            <input name="name" placeholder="MiiN Cosmetics" className="rounded border border-neutral-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            URL source concurrente (optionnel)
            <input
              name="source_url"
              placeholder="https://www.bravopromo.fr/code-promo-miin.html"
              className="rounded border border-neutral-300 px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="flex w-fit items-center gap-2 rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {pending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : null}
          {pending ? "Import en cours (≈ 1 min)…" : "Lancer l'import"}
        </button>
      </form>

      {pending ? (
        <p className="mt-4 text-sm text-neutral-500">
          Recherche de la page concurrente, extraction des offres, reformulation par DeepSeek, lecture du site
          officiel puis rédaction du contenu SEO. Ne fermez pas la page.
        </p>
      ) : null}

      {result ? (
        <div className={`mt-4 rounded border p-4 text-sm ${result.ok ? "border-emerald-700/40" : "border-red-700/50"}`}>
          <p className="mb-2 flex items-center gap-2 font-medium">
            {result.ok ? (
              <CheckCircle2 size={16} className="text-emerald-500" aria-hidden />
            ) : (
              <XCircle size={16} className="text-red-500" aria-hidden />
            )}
            {result.ok ? "Import terminé" : `Échec : ${result.error}`}
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-neutral-500">
            {result.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {result.ok && result.storeId ? (
            <div className="mt-3 flex gap-4">
              <Link href={`/admin/stores/${result.storeId}`} className="text-orange-700 underline">
                Modifier la boutique
              </Link>
              <a href={`/store/${result.storeSlug}/`} target="_blank" rel="noreferrer" className="text-orange-700 underline">
                Voir la page publique
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
