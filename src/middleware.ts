import { NextResponse, type NextRequest } from "next/server";
import { getSiteByHost } from "@/lib/tenant/site-directory";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";

  const devOverride =
    process.env.NODE_ENV !== "production"
      ? request.nextUrl.searchParams.get("__site") ?? process.env.DEV_SITE_COUNTRY ?? null
      : null;

  const site = await getSiteByHost(host, devOverride);

  if (!site) {
    return new NextResponse("Unknown domain", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-site-id", site.id);
  requestHeaders.set("x-site-lang", site.language);
  requestHeaders.set("x-site-country", site.countryCode);

  return NextResponse.next({ request: { headers: requestHeaders } });
}
