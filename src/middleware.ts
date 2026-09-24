import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSiteByHost } from "@/lib/tenant/site-directory";
import { hasSmugglingSignature, isRateLimited, stripInternalHeaders } from "@/lib/security";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

export async function middleware(request: NextRequest) {
  if (hasSmugglingSignature(request)) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (!request.headers.get("user-agent")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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
  stripInternalHeaders(requestHeaders);
  requestHeaders.set("x-site-id", site.id);
  requestHeaders.set("x-site-lang", site.language);
  requestHeaders.set("x-site-country", site.countryCode);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname.startsWith("/admin/login");

  if (isAdminRoute) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`admin:${ip}`)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  if (isAdminRoute && !isLoginRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request: { headers: requestHeaders } });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Session check only — the active-profile + permission check happens in
    // the admin layout, which needs the service-role client middleware
    // shouldn't carry. Fail closed either way: no session -> straight to login.
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}
