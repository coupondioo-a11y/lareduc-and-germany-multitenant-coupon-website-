import { NextResponse, type NextRequest } from "next/server";
import { getSiteContext } from "@/lib/site-context";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const site = await getSiteContext();
  const body = await request.json();

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (typeof endpoint !== "string" || typeof p256dh !== "string" || typeof auth !== "string") {
    return NextResponse.json({ error: "invalid subscription payload" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("push_subscriptions")
    .select("id")
    .eq("site_id", site.id)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (existing) {
    await admin
      .from("push_subscriptions")
      .update({ p256dh, auth, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    const { error } = await admin.from("push_subscriptions").insert({
      site_id: site.id,
      endpoint,
      p256dh,
      auth,
      source_store_slug: typeof body?.sourceStoreSlug === "string" ? body.sourceStoreSlug : null,
      user_agent: request.headers.get("user-agent"),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
