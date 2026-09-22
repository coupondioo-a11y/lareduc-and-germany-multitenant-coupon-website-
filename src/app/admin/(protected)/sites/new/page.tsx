import { createSite } from "../../actions";

export default function NewSitePage() {
  return (
    <div className="max-w-md">
      <h1 className="mb-4 text-lg font-semibold">Add country</h1>
      <form action={createSite} className="flex flex-col gap-3">
        <Field name="countryCode" label="Country code (e.g. DE)" />
        <Field name="primaryDomain" label="Domain (e.g. lareduc.de)" />
        <Field name="brandName" label="Brand name" />
        <Field name="language" label="Language (e.g. de)" />
        <Field name="locale" label="Locale (e.g. de-DE)" />
        <Field name="storeSlugPattern" label="Store slug pattern" defaultValue="{store}-gutschein" />
        <button type="submit" className="mt-2 rounded bg-neutral-900 px-3 py-2 text-sm text-white">
          Create site
        </button>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        required
        defaultValue={defaultValue}
        className="rounded border border-neutral-300 px-3 py-2"
      />
    </label>
  );
}
