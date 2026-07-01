/**
 * Nyata data seam. This is the REAL interface — the seven contract signatures
 * every screen calls. In S1 the bodies read from `lib/mock/*`.
 *
 * S13: swap each body to the real backend behind try/catch → mock. Keep the
 * signatures + types stable; only the implementation changes. Do not thicken
 * this file — it is a thin seam by design.
 */

import type {
  FeedFilter,
  FeedItem,
  Product,
  Profile,
  Recall,
  Scan,
  Verdict,
} from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/mock/products";
import { MOCK_VERDICTS } from "@/lib/mock/verdicts";
import { MOCK_RECALLS, NO_RECALLS } from "@/lib/mock/recalls";
import { MOCK_FEED_RECALLS } from "@/lib/mock/recalls";
import { MOCK_FEED } from "@/lib/mock/feed";
import { MOCK_SCANS } from "@/lib/mock/scans";
import { MOCK_PROFILE } from "@/lib/mock/profile";
import {
  getProfileReal,
  saveProfileReal,
  getScanHistoryReal,
  logScanReal,
} from "@/lib/api-server";

/** Simulate a tiny network hop so loading states are exercisable. */
const tick = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

/** Returns null for an unknown barcode so scan-flow (S3) hits the not-found path. */
export async function getProductByBarcode(
  barcode: string
): Promise<Product | null> {
  // S13: swap to real backend behind try/catch → mock.
  return tick(MOCK_PRODUCTS[barcode] ?? null);
}

export async function getVerdict(barcode: string): Promise<Verdict> {
  // S13: swap to real backend behind try/catch → mock.
  const verdict = MOCK_VERDICTS[barcode];
  if (verdict) return tick(verdict);
  // Unknown-but-scanned fallback: an empty SELAMAT-ish verdict.
  return tick({
    flags: [],
    rating: 0,
    summary_bm: "Tiada maklumat tersedia untuk produk ini.",
    summary_en: "No information available for this product.",
  });
}

export async function getRecallsForProduct(p: Product): Promise<Recall[]> {
  // S13: swap to real backend behind try/catch → mock.
  // Legal invariant: on any failure this falls back to [] — NEVER a fabricated recall.
  return tick(MOCK_RECALLS[p.barcode] ?? NO_RECALLS);
}

export async function getFeed(filter: FeedFilter): Promise<FeedItem[]> {
  // S13: swap to real backend behind try/catch → mock.
  const items = [...MOCK_FEED];
  switch (filter) {
    case "worst":
      return tick(items.sort((a, b) => b.rating - a.rating));
    case "newest":
      return tick(
        items.sort(
          (a, b) =>
            new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
        )
      );
    case "recalled":
      return tick(items.filter((i) => i.recalled));
  }
}

/**
 * Official recalls surfaced in the community feed (S6). DATA-INTEGRITY CRITICAL
 * PATH (specs §6, design-system §9): republishes official-source records ONLY.
 * Fails closed — any recall lacking an `official_url` is dropped here, never
 * rendered, so the UI can trust every card it receives carries a live source
 * link. Real backend (S11) keeps this filter; it is the legal invariant.
 */
export async function getFeedRecalls(): Promise<Recall[]> {
  // S13: swap to real backend behind try/catch → mock.
  const recalls = MOCK_FEED_RECALLS.filter((r) => Boolean(r.official_url));
  return tick(recalls);
}

/**
 * S9: real Supabase-backed reads/writes behind this seam. Each tries the
 * signed-in path (`lib/api-server.ts`, server actions, RLS-scoped) and FALLS
 * BACK to mock/guest on null or error — so guests, unconfigured env, and any
 * backend hiccup all keep the demo running. Guest mode is preserved by design.
 * // SEAM: S13 keeps these signatures; only the real/mock split lives here.
 */
export async function getScanHistory(): Promise<Scan[]> {
  try {
    const real = await getScanHistoryReal();
    if (real) return real; // signed-in: own history (may be empty)
  } catch {
    // fall through to mock
  }
  return tick(MOCK_SCANS); // guest / unconfigured / error
}

export async function getProfile(): Promise<Profile> {
  try {
    const real = await getProfileReal();
    if (real) return real;
  } catch {
    // fall through to mock
  }
  return tick(MOCK_PROFILE); // guest / unconfigured / error
}

export async function saveProfile(conditions: string[]): Promise<void> {
  try {
    const ok = await saveProfileReal(conditions);
    if (ok) return; // persisted to Supabase (signed-in)
  } catch {
    // fall through to mock
  }
  // Guest / unconfigured: persist in-memory for the session so the UI is honest.
  MOCK_PROFILE.conditions = conditions;
  await tick(undefined, 80);
}

/**
 * Log a scan. No-op for guests (returns silently). Server-only path derives the
 * user_id from the validated session — never from client input. Called from the
 * product page (server component) after a successful scan.
 */
export async function logScan(barcode: string): Promise<void> {
  try {
    await logScanReal(barcode);
  } catch {
    // Never block the verdict on a logging failure.
  }
}
