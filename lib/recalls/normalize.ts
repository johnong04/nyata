/**
 * Pure string normalization for recall matching. Used identically at seed time
 * (to pre-normalize match_brand / match_product keys) and at query time (to
 * normalize a scanned product), so both sides compare on the same footing.
 *
 * Lowercase, strip diacritics, punctuation/symbols -> single space, collapse
 * whitespace, trim. null / undefined / empty -> "".
 */
export function normalize(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ") // punctuation / symbols -> space
    .trim()
    .replace(/\s+/g, " ");
}

/** normalize + split into non-empty word tokens. */
export function tokens(s: string | null | undefined): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

/** Digits-only key for barcode comparison (GTIN/EAN). "" if none. */
export function normalizeBarcode(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/\D+/g, "");
}
