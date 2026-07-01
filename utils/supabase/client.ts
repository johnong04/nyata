import { createBrowserClient } from "@supabase/ssr";
import { isAuthConfigured } from "@/lib/auth-config";
import type { Database } from "./database.types";

/**
 * Browser Supabase client (RLS-bound via the publishable key).
 * Returns `null` in guest mode (no auth env) so callers degrade gracefully
 * instead of constructing a client with an undefined URL.
 */
export function createClient() {
  if (!isAuthConfigured()) return null;
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
