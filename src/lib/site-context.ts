import "server-only";
import { headers } from "next/headers";
import { getSiteById, type SiteRow } from "@/lib/tenant/site-directory";

/**
 * Reads the site resolved by middleware (x-site-id header) and returns the
 * full `sites` row. Every server component / route handler / Server Action
 * that touches content tables should scope its query by `siteContext.id`.
 */
export async function getSiteContext(): Promise<SiteRow> {
  const h = await headers();
  const siteId = h.get("x-site-id");

  if (!siteId) {
    throw new Error(
      "getSiteContext(): x-site-id header missing — is middleware running for this route?"
    );
  }

  const site = await getSiteById(siteId);
  if (!site) {
    throw new Error(`getSiteContext(): no site found for id ${siteId}`);
  }

  return site;
}
