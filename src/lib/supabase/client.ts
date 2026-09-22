import { createBrowserClient } from "@supabase/ssr";

/** Anon client for Client Components. Subject to RLS — cannot write. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
