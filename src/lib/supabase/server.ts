import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Anon client for Server Components / Route Handlers reading public data.
 * Subject to RLS — cannot write. Never use this for a write from a public
 * endpoint or any admin code path; use createAdminClient() instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no request context to write
            // cookies to — safe to ignore when middleware refreshes the session.
          }
        },
      },
    }
  );
}
