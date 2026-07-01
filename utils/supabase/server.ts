import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAuthConfigured } from "@/lib/auth-config";
import type { Database } from "./database.types";

/**
 * Server Supabase client for Server Components, route handlers, and actions.
 * Returns `null` in guest mode (no auth env) so server code degrades gracefully.
 */
export async function createClient() {
  if (!isAuthConfigured()) return null;
  const cookieStore = await cookies(); // Next 16 / React 19: cookies() is async

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refresh covers it.
          }
        },
      },
    },
  );
}
