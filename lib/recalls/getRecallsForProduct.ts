/**
 * Recall cross-check mapping helpers (pure, no I/O). The Supabase read lives in
 * `lib/api-server.ts` (a `"use server"` boundary) which calls into these; this
 * keeps the seam out of the client bundle without a `server-only` import that
 * would poison `lib/api.ts` (imported by client components too).
 *
 * GRACEFUL DEGRADATION (legal invariant): the caller returns [] on empty table,
 * query error, or guest mode. RecallBlock renders [] as "no official recalls
 * found" — never a crash, NEVER a fabricated recall.
 */
import { matchRecalls } from "./match";
import type { RecallRow } from "./types";
import type { Product, Recall, Severity } from "@/lib/types";

/** Map raw DB severity (verdict band or level) to the shared Severity. */
export function toSeverity(raw: unknown): Severity {
  switch (String(raw ?? "").toLowerCase()) {
    case "low":
    case "selamat":
      return "low";
    case "med":
    case "medium":
    case "waspada":
      return "med";
    default:
      // 'high', 'elak', unknown -> high. Fail toward caution on RENDER only;
      // matching itself stays conservative (a hit is already a strong signal).
      return "high";
  }
}

/** DB row (snake_case) -> matcher RecallRow (camelCase). */
export function toRow(r: Record<string, unknown>): RecallRow {
  return {
    source: String(r.source ?? ""),
    matchBarcode: (r.match_barcode as string) ?? null,
    matchBrand: (r.match_brand as string) ?? null,
    matchProduct: (r.match_product as string) ?? null,
    title: String(r.title ?? ""),
    officialUrl: String(r.official_url ?? ""),
    date: String(r.date ?? ""),
    severity: String(r.severity ?? "high"),
  };
}

/** Matched RecallRow -> rendered Recall (shared UI shape). */
export function toRecall(row: RecallRow): Recall {
  return {
    source: row.source,
    title: row.title,
    official_url: row.officialUrl,
    date: row.date,
    severity: toSeverity(row.severity),
  };
}

/**
 * Pure cross-check over already-fetched raw DB rows. Runs the conservative
 * matcher and maps hits to Recall, dropping any hit lacking a live official_url
 * (fail closed — never render an unsourced accusation).
 */
export function recallsForProductFromRows(
  product: Product,
  rawRows: Record<string, unknown>[],
): Recall[] {
  const rows = rawRows.map(toRow);
  return matchRecalls(product, rows)
    .map(toRecall)
    .filter((r) => Boolean(r.official_url));
}
