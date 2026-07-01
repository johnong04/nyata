"use server";

/**
 * Real Supabase-backed data functions — the SIGNED-IN path behind the `lib/api.ts`
 * seam. SERVER-ONLY (`"use server"`): every export is a server action; nothing
 * here reaches the client bundle. All reads/writes go through the USER SESSION
 * (publishable-key cookie client) so RLS enforces owner-only access — no secret
 * key, no client-supplied user_id (it is always derived from the validated
 * session).
 *
 * Guest fallback lives in `lib/api.ts`: these return null/[]/no-op when there is
 * no session or no auth env, and the seam swaps in mock data so the demo runs.
 *
 * // SEAM: S13 flips `lib/api.ts` callers from stubs to these.
 */

import type { Profile, Scan } from "@/lib/types";
import { bandForRating } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { isAuthConfigured } from "@/lib/auth-config";

const ALLOWED_CONDITIONS = ["allergy", "diabetic", "pregnant", "kid"] as const;

/** Current user's profile, or null when guest / unauthenticated. */
export async function getProfileReal(): Promise<Profile | null> {
  if (!isAuthConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("conditions, is_premium")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return { conditions: data.conditions ?? [], is_premium: data.is_premium };
}

/** Update own conditions. Session-derived id; unknown conditions filtered out. */
export async function saveProfileReal(conditions: string[]): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const supabase = await createClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const clean = conditions.filter((c) =>
    (ALLOWED_CONDITIONS as readonly string[]).includes(c),
  );

  const { error } = await supabase
    .from("profiles")
    .update({ conditions: clean })
    .eq("id", user.id); // RLS also enforces this; belt-and-braces.
  return !error;
}

/** Own scan history, newest first, joined to product name. Null when guest. */
export async function getScanHistoryReal(): Promise<Scan[] | null> {
  if (!isAuthConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("scans")
    .select("product_id, created_at, products(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return null;

  return data.map((row) => {
    const product = row.products as { name: string | null } | null;
    return {
      barcode: row.product_id,
      name: product?.name ?? row.product_id,
      // History fixtures carry a band/rating; the scans table doesn't yet, so
      // default to a neutral band. S13 can enrich from the verdicts table.
      band: bandForRating(0),
      rating: 0,
      scanned_at: row.created_at,
    };
  });
}

/**
 * Log a scan for the signed-in user. user_id is ALWAYS the validated session
 * user — never trust a client-supplied id. No-op (returns false) when guest or
 * unauthenticated; that's acceptable — the users metric counts signed-in scans.
 */
export async function logScanReal(barcode: string): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const supabase = await createClient();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("scans")
    .insert({ user_id: user.id, product_id: barcode });
  // A FK violation (product not yet cached) just means no history row — never
  // block the verdict. Fail soft.
  return !error;
}
