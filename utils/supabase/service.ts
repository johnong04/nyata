import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Service-role Supabase client — writes PAST RLS using the secret key.
 * SERVER-ONLY: the `server-only` import above makes any `"use client"` import a
 * build error. Never reference `SUPABASE_SECRET_KEY` from a client module or a
 * `NEXT_PUBLIC_*` var. No cookies / no session — this client is not user-scoped.
 *
 * Consumers: S10 verdict-cache writes, S11 recall-seed writes (both server-side).
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
