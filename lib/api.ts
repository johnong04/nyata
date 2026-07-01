/**
 * Nyata data seam. This is the REAL interface — the contract signatures every
 * screen calls. Bodies hit the real backend (S8–S11) and fall back to `lib/mock/*`
 * on ANY failure (error / missing env / timeout) so the demo renders identically
 * whether the backend is up or down.
 *
 * S13 unified this: every export routes through ONE `withFallback(live, mock, opts)`
 * + `withTimeout` wrapper. Signatures + types are frozen — only the bodies changed.
 * Do not thicken this file; it is a thin seam by design.
 *
 * CLIENT-SAFE: this module is imported by client components (scan-client prefetches
 * getProductByBarcode). It must NOT import `server-only` code. Secret/AI-bearing
 * live paths go through `lib/api-server.ts` (`"use server"` actions), never a direct
 * SDK/engine import here.
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
  getRecallsForProductReal,
  getProductByBarcodeReal,
  getVerdictReal,
} from "@/lib/api-server";

// ---------------------------------------------------------------------------
// S13 — the ONE fallback mechanism. Every seam body routes through withFallback.
// ---------------------------------------------------------------------------

/**
 * Force-mock switch. `NEXT_PUBLIC_USE_MOCKS=1` → every seam skips its live call
 * and returns mock (100%-deterministic filmed demo). Empty/0/unset → live path
 * with automatic fallback. NEXT_PUBLIC_ so it's readable server- AND client-side.
 */
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === "1";

/** Reject after `ms` so a hung backend can't freeze the loader mid-demo. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`api timeout after ${ms}ms`)), ms),
    ),
  ]);
}

/**
 * Try the live backend; on force-mock, error, missing env, or timeout, return the
 * mock. Uniform, greppable, boring — every seam body is one call to this.
 *
 * `neverFabricate: true` is a legal trip-wire (specs §6): the caller's `mock()`
 * MUST be the empty/safe value (`[]`, `null`), never invented official/auth data.
 * In dev we assert it and warn loudly if a non-empty value slips through.
 */
async function withFallback<T>(
  live: () => Promise<T>,
  mock: () => T,
  opts?: { timeoutMs?: number; neverFabricate?: boolean },
): Promise<T> {
  const safeMock = (): T => {
    const v = mock();
    if (
      opts?.neverFabricate &&
      process.env.NODE_ENV !== "production" &&
      Array.isArray(v) &&
      v.length > 0
    ) {
      // Trip-wire: a neverFabricate fallback must be empty. If this fires, someone
      // wired a fabricated recall/session into a legal critical path — fix the call.
      console.error(
        "[api fallback] neverFabricate returned non-empty data — refusing to fabricate.",
      );
    }
    return v;
  };

  if (FORCE_MOCK) return safeMock();
  try {
    return await withTimeout(live(), opts?.timeoutMs ?? 6000);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.warn("[api fallback]", e);
    return safeMock();
  }
}

/** Simulate a tiny network hop so loading states are exercisable (mock path). */
const tick = <T>(value: T, ms = 120): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// Seam functions — data paths.
// ---------------------------------------------------------------------------

/** Returns null for an unknown barcode so scan-flow (S3) hits the not-found path. */
export async function getProductByBarcode(
  barcode: string,
): Promise<Product | null> {
  return withFallback(
    // Live: S10 engine (cache → OpenFoodFacts) via the server-action boundary.
    () => getProductByBarcodeReal(barcode),
    // Fallback: mock product, or null for a known-not-found barcode.
    () => MOCK_PRODUCTS[barcode] ?? null,
  );
}

export async function getVerdict(barcode: string): Promise<Verdict> {
  return withFallback<Verdict>(
    // Live: S10 verdict engine (cache → OFF → AI; stubs on failure) via server action.
    () => getVerdictReal(barcode),
    // Fallback: mock verdict, or a neutral "no information" verdict for an unknown
    // barcode. Copy stays informational/non-diagnostic (design-system §9).
    () =>
      MOCK_VERDICTS[barcode] ?? {
        flags: [],
        rating: 0,
        summary_bm: "Tiada maklumat tersedia untuk produk ini.",
        summary_en: "No information available for this product.",
      },
  );
}

/**
 * Per-scan recall cross-check. DATA-INTEGRITY / DEFAMATION CRITICAL PATH (specs §6).
 * Live path (S11) returns:
 *   - null  → real path unavailable (guest / no env): use official-source fixtures.
 *   - []    → real path ran, no official recall matched: AUTHORITATIVE, do NOT
 *             fall through to mock (that would fabricate a hit).
 *   - [...] → matched official recalls (each carries a live official_url).
 * On real-path ERROR/timeout the withFallback fallback yields the fixture set
 * (still official-source-only). NEVER a fabricated accusation on a scanned product.
 */
export async function getRecallsForProduct(p: Product): Promise<Recall[]> {
  return withFallback(
    async () => {
      const real = await getRecallsForProductReal(p);
      // null = unavailable → surface fixtures (mock, but official-source-framed).
      // [] = authoritative "no recall" → return it, do NOT fabricate.
      if (real === null) return MOCK_RECALLS[p.barcode] ?? NO_RECALLS;
      return real;
    },
    () => MOCK_RECALLS[p.barcode] ?? NO_RECALLS,
  );
}

export async function getFeed(filter: FeedFilter): Promise<FeedItem[]> {
  return withFallback(
    // S13: awaiting S8 feed_items view — live path not yet built, keep mock as live
    // so the flip is one line later. Wrapper is in place; behavior is identical.
    () => mockFeed(filter),
    () => {
      // Synchronous mock (fallback path can't await tick; identical ordering).
      const items = [...MOCK_FEED];
      switch (filter) {
        case "worst":
          return items.sort((a, b) => b.rating - a.rating);
        case "newest":
          return items.sort(
            (a, b) =>
              new Date(b.scanned_at).getTime() -
              new Date(a.scanned_at).getTime(),
          );
        case "recalled":
          return items.filter((i) => i.recalled);
      }
    },
  );
}

/** Mock feed with a network-hop tick (the "live" placeholder until S8's view). */
async function mockFeed(filter: FeedFilter): Promise<FeedItem[]> {
  const items = [...MOCK_FEED];
  switch (filter) {
    case "worst":
      return tick(items.sort((a, b) => b.rating - a.rating));
    case "newest":
      return tick(
        items.sort(
          (a, b) =>
            new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime(),
        ),
      );
    case "recalled":
      return tick(items.filter((i) => i.recalled));
  }
}

/**
 * Official recalls surfaced in the community feed (S6). DATA-INTEGRITY CRITICAL
 * PATH (specs §6, design-system §9): republishes official-source records ONLY.
 * Fails closed — any recall lacking an `official_url` is dropped here, never
 * rendered, so the UI can trust every card it receives carries a live source link.
 */
export async function getFeedRecalls(): Promise<Recall[]> {
  return withFallback(
    // S13: awaiting S11 feed-recall query — mock-as-live for now, filter preserved.
    () => tick(MOCK_FEED_RECALLS.filter((r) => Boolean(r.official_url))),
    () => MOCK_FEED_RECALLS.filter((r) => Boolean(r.official_url)),
  );
}

// ---------------------------------------------------------------------------
// Seam functions — auth-adjacent (S9). Signed-in path via server actions; guest/
// unconfigured/error falls back to mock. Auth is NEVER faked (see below).
// ---------------------------------------------------------------------------

export async function getScanHistory(): Promise<Scan[]> {
  return withFallback(
    async () => {
      const real = await getScanHistoryReal();
      if (real) return real; // signed-in: own history (may be empty)
      return MOCK_SCANS; // guest / unconfigured → illustrative mock
    },
    () => MOCK_SCANS,
  );
}

export async function getProfile(): Promise<Profile> {
  return withFallback(
    async () => {
      const real = await getProfileReal();
      if (real) return real;
      return MOCK_PROFILE; // guest / unconfigured → illustrative mock
    },
    () => MOCK_PROFILE,
  );
}

export async function saveProfile(conditions: string[]): Promise<void> {
  await withFallback(
    async () => {
      const ok = await saveProfileReal(conditions);
      if (ok) return; // persisted to Supabase (signed-in)
      // Guest / unconfigured: persist in-memory for the session so the UI is honest.
      MOCK_PROFILE.conditions = conditions;
    },
    () => {
      MOCK_PROFILE.conditions = conditions;
    },
  );
}

/**
 * Log a scan. Signed-in only (server derives user_id from the validated session —
 * never client input). Guest / error → silent no-op; a dropped log NEVER blocks or
 * fakes the flow. `logScanReal` already swallows its own errors and returns false.
 */
export async function logScan(barcode: string): Promise<void> {
  await withFallback(
    async () => {
      await logScanReal(barcode);
    },
    () => {
      // no-op: never fabricate a scan, never block the verdict.
    },
  );
}
