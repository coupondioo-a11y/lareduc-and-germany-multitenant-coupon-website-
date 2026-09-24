import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadLogo } from "../actions";

export default async function LogoManagerPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const admin = createAdminClient();
  const { data: store } = await admin
    .from("stores")
    .select("id, name, logo_url, logo_source, logo_imported_at")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) notFound();

  return (
    <div className="max-w-sm">
      <h1 className="mb-4 text-lg font-semibold">Logo — {store.name}</h1>

      {store.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.logo_url} alt="" className="mb-4 h-24 w-24 rounded border border-neutral-200 bg-white object-contain p-2" />
      ) : (
        <p className="mb-4 text-sm text-neutral-500">
          Aucun logo importé — le site affiche un bloc de couleur généré à la place.
        </p>
      )}

      <form action={uploadLogo} encType="multipart/form-data" className="flex flex-col gap-3">
        <input type="hidden" name="store_id" value={store.id} />
        <input type="file" name="file" accept="image/png,image/jpeg,image/webp" required className="text-sm" />
        <p className="text-xs text-neutral-500">Redimensionné automatiquement à 760px max, converti en WebP.</p>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Importer
        </button>
      </form>
    </div>
  );
}
