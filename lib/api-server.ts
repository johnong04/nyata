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

import type { Product, Profile, Recall, Scan, Verdict } from "@/lib/types";
import { bandForRating } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { isAuthConfigured } from "@/lib/auth-config";
import { recallsForProductFromRows } from "@/lib/recalls/getRecallsForProduct";
import {
  getProductByBarcode as getProductByBarcodeEngine,
  getVerdict as getVerdictEngine,
} from "@/lib/verdict";

const ALLOWED_CONDITIONS = ["allergy", "diabetic", "pregnant", "kid"] as const;

/**
 * S13: server-boundary adapters for the verdict engine (`lib/verdict`, which is
 * `server-only` — AI + service keys, must never reach the client bundle). The
 * `lib/api.ts` seam is client-importable (scan-client prefetches
 * getProductByBarcode), so it CANNOT import `lib/verdict` directly. It calls
 * these `"use server"` actions instead; the seam wraps them in `withFallback`.
 *
 * Adaptation: the engine's `getVerdict` takes `{ barcode, labelPhoto? }` and
 * returns `VerdictWithCopy` (a Verdict superset + disclaimer copy). The seam's
 * contract is `getVerdict(barcode) → Verdict`; the superset satisfies it and the
 * extra copy fields ride along harmlessly for callers that use them.
 */

/** Real product lookup (cache → OFF). Null = not found. Never throws. */
export async function getProductByBarcodeReal(
  barcode: string,
): Promise<Product | null> {
  return getProductByBarcodeEngine(barcode);
}

/** Real verdict (cache → OFF → AI; stub on any failure). Never throws. */
export async function getVerdictReal(barcode: string): Promise<Verdict> {
  return getVerdictEngine({ barcode });
}

/**
 * OCR "snap the label" path. Takes a label photo (base64 data URL), derives a
 * STABLE synthetic barcode from the bytes (`ocr-<hash>` — same photo → same
 * barcode, so a re-snap reuses the cached verdict instead of re-billing OCR/AI),
 * and runs the full engine with `labelPhoto` set. The engine OCRs the label →
 * builds a `source:"ocr"` product → caches it under the synthetic barcode → AI
 * verdict. Because the product is cached under that barcode, the existing
 * `/product/<synthetic>` page resolves it on the follow-up navigation.
 *
 * Returns the synthetic barcode plus `ok`: `ok:false` means the engine could not
 * read the label (no OCR key / unreadable photo / AI failure → stub verdict), so
 * the client can surface a friendly "couldn't read the label" retry instead of
 * routing into a dead-end product page. Never throws.
 */
export async function getVerdictFromPhoto(
  dataUrl: string,
): Promise<{ barcode: string; ok: boolean }> {
  const barcode = syntheticBarcode(dataUrl);
  try {
    const verdict = await getVerdictEngine({ barcode, labelPhoto: dataUrl });
    // A stub verdict (rating 5, zero flags) means OCR/AI didn't complete — the
    // engine never caches stubs, so no product row exists to route to. Signal a
    // friendly retry rather than a 404.
    const ok = !(verdict.rating === 5 && verdict.flags.length === 0);
    return { barcode, ok };
  } catch {
    return { barcode, ok: false };
  }
}

/** Stable `ocr-<8-hex>` barcode from the photo bytes (djb2 — no crypto import). */
function syntheticBarcode(dataUrl: string): string {
  let h = 5381;
  for (let i = 0; i < dataUrl.length; i++) {
    h = ((h << 5) + h + dataUrl.charCodeAt(i)) | 0;
  }
  return "ocr-" + (h >>> 0).toString(16).padStart(8, "0");
}

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
 * Real recall cross-check (S11). DATA-INTEGRITY / DEFAMATION CRITICAL PATH
 * (specs §6). Reads the PUBLIC-READ `recalls` table and runs the conservative,
 * false-negative-biased matcher (lib/recalls/match.ts). Returns:
 *   - null  -> real path unavailable (guest mode / no env); seam falls back to mock.
 *   - []    -> real path ran, NO official recall matched (a legitimate answer);
 *              seam renders "no official recalls found", never a fabrication.
 *   - [...] -> matched official recalls, each carrying a live official_url.
 * Any thrown error is swallowed to [] so the verdict page never crashes on this.
 */
export async function getRecallsForProductReal(
  product: Product,
): Promise<Recall[] | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null; // guest mode / no auth env -> mock fallback
    const { data, error } = await supabase
      .from("recalls")
      .select(
        "source, match_barcode, match_brand, match_product, title, official_url, date, severity",
      );
    if (error || !data) return []; // query failed -> no accusation (NOT mock — table is authoritative)
    return recallsForProductFromRows(
      product,
      data as unknown as Record<string, unknown>[],
    );
  } catch {
    return []; // never crash the verdict on the recall read
  }
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
