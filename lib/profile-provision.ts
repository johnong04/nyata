import "server-only";

/**
 * Idempotent profile provisioning on sign-in.
 *
 * The `handle_new_user` trigger (SECURITY DEFINER) already inserts a `profiles`
 * row when a user is created in `auth.users`, and `profiles` has NO INSERT RLS
 * policy — so a session-scoped upsert would be REJECTED by RLS. This is the
 * deliberate deviation from the plan's "app-side session upsert": the trigger is
 * the authoritative provisioning path.
 *
 * This helper is belt-and-braces: it checks (through the user session, which the
 * SELECT-own policy allows) that the row exists. Only if it is somehow missing
 * does it insert via the service-role client (server-only, RLS-bypassing). It
 * derives the id from the VALIDATED session user — never from client input.
 */

import { createClient } from "@/utils/supabase/server";
import { createServiceClient } from "@/utils/supabase/service";
import { isAuthConfigured } from "@/lib/auth-config";

export async function ensureProfile(): Promise<void> {
  if (!isAuthConfigured()) return;
  const supabase = await createClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // no validated session → nothing to provision

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return; // trigger already provisioned it — done

  // Fallback only: trigger didn't fire. Service client bypasses RLS (no INSERT
  // policy exists for the session). id is the session user's — safe.
  try {
    const service = createServiceClient();
    await service
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  } catch {
    // Best-effort; a missing SECRET key just means we lean on the trigger.
  }
}
