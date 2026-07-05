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

import type {
  Dossier,
  FeedFilter,
  FeedItem,
  Member,
  Product,
  Profile,
  Recall,
  Scan,
  Verdict,
  VerdictBand,
} from "@/lib/types";
import type { Json } from "@/utils/supabase/database.types";
import { bandForRating } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";
import { isAuthConfigured } from "@/lib/auth-config";
import {
  recallsForProductFromRows,
  toRecall,
  toRow,
} from "@/lib/recalls/getRecallsForProduct";
import {
  getProductByBarcode as getProductByBarcodeEngine,
  getVerdict as getVerdictEngine,
} from "@/lib/verdict";
import {
  getDossier as getDossierEngine,
  getDossierCached as getDossierCachedEngine,
} from "@/lib/dossier";

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
 * Photo → verdict. If `barcode` is supplied (barcode detected but OFF missed),
 * the OCR product is cached under that REAL barcode — the identity anchor, so
 * later scanners hit the cache with the barcode alone (§11.4). With no barcode
 * (pure "snap the label"), a stable synthetic `ocr-<hash>` key is derived from
 * the photo bytes so a re-snap reuses the cached verdict instead of re-billing.
 * `backPhoto` = ingredients side, `frontPhoto` = name/brand side (either optional).
 * Returns the resolved barcode + `ok` (false = unreadable → client shows a retry,
 * not a dead-end page). Never throws.
 */
export async function getVerdictFromPhotos(input: {
  barcode?: string;
  backPhoto?: string;
  frontPhoto?: string;
}): Promise<{ barcode: string; ok: boolean }> {
  const key =
    input.barcode?.trim() ||
    syntheticBarcode((input.backPhoto ?? "") + (input.frontPhoto ?? ""));
  try {
    const verdict = await getVerdictEngine({
      barcode: key,
      labelPhoto: input.backPhoto,
      frontPhoto: input.frontPhoto,
    });
    // Stub (rating 5, zero flags) ⇒ OCR/AI didn't complete ⇒ no product row to
    // route to ⇒ signal a friendly retry rather than a 404.
    const ok = !(verdict.rating === 5 && verdict.flags.length === 0);
    return { barcode: key, ok };
  } catch {
    return { barcode: key, ok: false };
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

/** Real dossier (cache → grounded Gemini). Null = nothing on record / no key. Never throws. */
export async function getDossierReal(input: {
  brand: string;
  name: string;
  barcode?: string;
}): Promise<Dossier | null> {
  return getDossierEngine(input);
}

/** Cache-only dossier read (no AI spend). Null when not pre-warmed/cached. */
export async function getDossierCachedReal(input: {
  brand: string;
  name: string;
}): Promise<Dossier | null> {
  return getDossierCachedEngine(input);
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
    .select("conditions, is_premium, members")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return {
    conditions: data.conditions ?? [],
    is_premium: data.is_premium,
    members: (data.members as unknown as Member[]) ?? [],
  };
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

/** Persist this user's members list (self + kids). Session-derived id. */
export async function saveMembersReal(members: Member[]): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("profiles")
    .update({ members: members as unknown as Json })
    .eq("id", user.id); // RLS also enforces owner-only.
  return !error;
}

/**
 * STUB premium unlock (§11.5). Flips is_premium with NO payment — real
 * ToyyibPay/Stripe is a later run (tasks.md Deferred → S12 payments). Session-derived id.
 */
export async function setPremiumStubReal(on: boolean): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const supabase = await createClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("profiles")
    .update({ is_premium: on })
    .eq("id", user.id);
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

/**
 * Live "Hidden Ingredients" feed (S7). Reads the public `feed_items` view
 * (products join verdicts, aligned to FeedItem). Per-filter ordering is applied
 * here; the view's built-in ORDER BY is a harmless default. Returns:
 *   - null  -> client unavailable (no auth env) or query error -> seam -> mock.
 *   - [...] -> authoritative live rows (may be empty for the recalled filter).
 * Feed data is verdict-derived (ingredient-only, self-authored) — no legal
 * fabrication concern, so empty is a valid answer, not a mock trigger.
 */
export async function getFeedReal(
  filter: FeedFilter,
): Promise<FeedItem[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  let q = supabase
    .from("feed_items")
    .select("barcode, name, brand, band, rating, flagged_count, recalled, scanned_at");

  if (filter === "recalled") q = q.eq("recalled", true);
  q =
    filter === "newest"
      ? q.order("scanned_at", { ascending: false })
      : q.order("rating", { ascending: false }); // worst + recalled lead by rating

  const { data, error } = await q.limit(50);
  if (error || !data) return null;

  return data.map((row) => {
    const rating = Number(row.rating);
    return {
      barcode: String(row.barcode),
      name: (row.name as string | null) ?? String(row.barcode),
      brand: (row.brand as string | null) ?? "",
      band: ((row.band as VerdictBand | null) ?? bandForRating(rating)) as VerdictBand,
      rating,
      flagged_count: Number(row.flagged_count ?? 0),
      recalled: Boolean(row.recalled),
      scanned_at: String(row.scanned_at),
    };
  });
}

/**
 * Live official recalls for the community feed (S7). DATA-INTEGRITY / DEFAMATION
 * CRITICAL PATH (specs §6): republishes official-source rows only. FAILS CLOSED —
 * any row missing `official_url` is dropped, never rendered. Returns:
 *   - null  -> unavailable/error -> seam falls back to official-source fixtures.
 *   - [...] -> official recalls, newest first, each carrying a live official_url.
 */
export async function getFeedRecallsReal(): Promise<Recall[] | null> {
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("recalls")
      .select(
        "source, match_barcode, match_brand, match_product, title, official_url, date, severity",
      )
      .order("date", { ascending: false })
      .limit(20);
    if (error || !data) return null;
    return data
      .map((r) => toRecall(toRow(r as unknown as Record<string, unknown>)))
      .filter((r) => Boolean(r.official_url));
  } catch {
    return null;
  }
}
