type Store = { id: string; name: string };

export function CouponForm({
  action,
  stores,
  coupon,
}: {
  action: (formData: FormData) => void;
  stores: Store[];
  coupon?: {
    id: string;
    store_id: string;
    title: string;
    type: string;
    code: string | null;
    discount_value: string | null;
    expiry_date: string | null;
    destination_url: string | null;
    is_active: boolean;
    is_featured: boolean;
  };
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-3">
      {coupon ? <input type="hidden" name="id" value={coupon.id} /> : null}

      <label className="flex flex-col gap-1 text-sm">
        Boutique
        <select
          name="store_id"
          defaultValue={coupon?.store_id}
          required
          className="rounded border border-neutral-300 px-3 py-2"
        >
          <option value="" disabled>
            Choisir une boutique
          </option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Titre
        <input name="title" defaultValue={coupon?.title} required className="rounded border border-neutral-300 px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Code (laisser vide pour une offre sans code)
        <input name="code" defaultValue={coupon?.code ?? ""} className="rounded border border-neutral-300 px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Type (si pas de code)
        <select name="type" defaultValue={coupon?.type ?? "deal"} className="rounded border border-neutral-300 px-3 py-2">
          <option value="deal">deal</option>
          <option value="free_shipping">free_shipping</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Réduction affichée (ex : -20 %)
        <input name="discount_value" defaultValue={coupon?.discount_value ?? ""} className="rounded border border-neutral-300 px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Date d&apos;expiration
        <input type="date" name="expiry_date" defaultValue={coupon?.expiry_date ?? ""} className="rounded border border-neutral-300 px-3 py-2" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        URL de destination (optionnel)
        <input name="destination_url" defaultValue={coupon?.destination_url ?? ""} className="rounded border border-neutral-300 px-3 py-2" />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={coupon?.is_active ?? true} />
        Actif
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_featured" defaultChecked={coupon?.is_featured} />
        Mis en avant
      </label>

      <button type="submit" className="mt-2 rounded bg-neutral-900 px-3 py-2 text-sm text-white">
        Enregistrer
      </button>
    </form>
  );
}
