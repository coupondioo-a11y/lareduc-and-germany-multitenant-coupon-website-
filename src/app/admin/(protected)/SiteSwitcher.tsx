"use client";

import { setActiveSite } from "./actions";

export function SiteSwitcher({
  sites,
  activeSiteId,
}: {
  sites: { id: string; country_code: string; brand_name: string }[];
  activeSiteId?: string;
}) {
  return (
    <form action={setActiveSite}>
      <select
        name="siteId"
        defaultValue={activeSiteId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border border-neutral-300 px-2 py-1 text-sm"
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.country_code} — {s.brand_name}
          </option>
        ))}
      </select>
    </form>
  );
}
