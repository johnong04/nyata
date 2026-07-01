/**
 * Nyata core domain types. Mirrors nyata-specs.md §4.
 * The `lib/api.ts` seam and every screen type against these; S13 swaps only
 * the api *bodies* to the real backend, never these shapes.
 */

export type Source = "off" | "ocr";

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  ingredients_raw: string;
  source: Source;
  cached_at: string; // ISO
}

export type FlagKind =
  | "additive"
  | "sugar_sodium"
  | "halal_doubtful"
  | "allergen";

export type Severity = "low" | "med" | "high";

export interface Flag {
  e_number?: string;
  name: string;
  kind: FlagKind;
  note_bm: string;
  note_en: string;
  severity: Severity;
}

export interface Verdict {
  flags: Flag[];
  rating: number; // 0–10, higher = worse
  summary_bm: string;
  summary_en: string;
}

export interface Recall {
  source: string; // official body, e.g. "MOH" / "KKM"
  title: string;
  official_url: string;
  date: string; // ISO
  severity: Severity;
}

/** Verdict bands — design-system §3. Higher score = worse. */
export type VerdictBand = "SELAMAT" | "WASPADA" | "ELAK";

export interface FeedItem {
  barcode: string;
  name: string;
  brand: string;
  band: VerdictBand;
  rating: number;
  flagged_count: number;
  recalled: boolean;
  scanned_at: string; // ISO
}

/** Feed filter values — tasks.md PREFLIGHT #4. S6 drops the "Additive" tab. */
export type FeedFilter = "worst" | "newest" | "recalled";

export interface Scan {
  barcode: string;
  name: string;
  band: VerdictBand;
  rating: number;
  scanned_at: string; // ISO
}

export interface Profile {
  conditions: string[];
  is_premium: boolean;
}

/** Map a 0–10 risk score → verdict band (design-system §3). */
export function bandForRating(rating: number): VerdictBand {
  if (rating < 4) return "SELAMAT";
  if (rating < 7) return "WASPADA";
  return "ELAK";
}

/** EN gloss for a band — used in verdict displays (word + score + gloss). */
export function glossForBand(band: VerdictBand): string {
  switch (band) {
    case "SELAMAT":
      return "safe";
    case "WASPADA":
      return "be wary";
    case "ELAK":
      return "avoid";
  }
}
