/**
 * Conservative recall matcher. LEGAL / DATA-INTEGRITY CRITICAL PATH (specs §6):
 * bias to FALSE-NEGATIVE. Never wrongly flag a safe product. When the signal is
 * ambiguous, do NOT match. A missed recall is recoverable (the scraper widens
 * coverage later); a wrongly-flagged safe brand is a defamation exposure.
 *
 * A row matches a product ONLY on a strong, unambiguous signal:
 *   1. Barcode exact match  — the digits-only product barcode equals the row's
 *      normalized match_barcode. This is the safest possible key: zero
 *      false-positive risk. Preferred whenever the recall carries a barcode.
 *   2. Brand + product corroboration — the row's match_brand appears (token-
 *      boundary) in the product's brand AND the row's match_product appears in
 *      the product's name. Both must align. Brand alone never matches; a single
 *      shared common word never matches.
 *
 * Pure function, no I/O.
 */
import { normalize, normalizeBarcode } from "./normalize";
import type { ProductLike, RecallRow } from "./types";

/**
 * True if `needle` (normalized) occurs as a contiguous-token substring of `hay`
 * (normalized). Token-boundary aware: "milo" does not match inside "milong".
 */
function phraseIn(needle: string | null, hay: string): boolean {
  const n = normalize(needle);
  if (!n) return false;
  const h = normalize(hay);
  if (!h) return false;
  if (h === n) return true;
  return ` ${h} `.includes(` ${n} `);
}

export function matchRecalls(
  product: ProductLike,
  rows: RecallRow[],
): RecallRow[] {
  const barcode = normalizeBarcode(product.barcode);
  const brand = normalize(product.brand);
  const name = normalize(product.name);

  // Nothing to match against -> no accusation.
  if (!barcode && !brand && !name) return [];

  const hits: RecallRow[] = [];
  for (const row of rows) {
    let matched = false;

    // Rule 1: barcode exact match (safest, zero false-positive).
    if (barcode && row.matchBarcode) {
      if (normalizeBarcode(row.matchBarcode) === barcode) matched = true;
    }

    // Rule 2: brand AND product both corroborate. Never brand-alone.
    if (!matched && row.matchBrand && row.matchProduct) {
      const brandAligned = phraseIn(row.matchBrand, brand);
      const productAligned = phraseIn(row.matchProduct, name);
      if (brandAligned && productAligned) matched = true;
    }

    if (matched) hits.push(row);
  }
  return hits;
}
