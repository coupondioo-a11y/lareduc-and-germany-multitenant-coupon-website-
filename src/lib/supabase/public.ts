import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Anon client with no cookie/session handling -- safe to call from unstable_cache'd functions. */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
