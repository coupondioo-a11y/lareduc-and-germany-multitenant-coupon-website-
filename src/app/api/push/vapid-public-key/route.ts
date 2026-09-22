import { NextResponse } from "next/server";
import { getSiteContext } from "@/lib/site-context";
import { getVapidKeys } from "@/lib/site-secrets";

export async function GET() {
  const site = await getSiteContext();
  const keys = await getVapidKeys(site.id);
  if (!keys) return NextResponse.json({ error: "push not configured for this site" }, { status: 404 });
  return NextResponse.json({ publicKey: keys.publicKey });
}
