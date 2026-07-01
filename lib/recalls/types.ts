/**
 * Recall-matching internal types. These back the real getRecallsForProduct
 * seam; the shape RENDERED to the UI is the shared `Recall` in `@/lib/types`
 * (source, title, official_url, date, severity). RecallRow mirrors the actual
 * Supabase `recalls` columns (S8): match_barcode / match_brand / match_product.
 */

/** A raw recalls-table row, in camelCase, as the matcher consumes it. */
export type RecallRow = {
  source: string; // issuing authority label, e.g. "NPRA Malaysia"
  matchBarcode: string | null; // pre-normalized digits-only barcode key (nullable)
  matchBrand: string | null; // pre-normalized brand key (nullable)
  matchProduct: string | null; // pre-normalized product-name key (nullable)
  title: string; // official recall title, verbatim
  officialUrl: string; // link to the official notice — always shown
  date: string; // ISO 'YYYY-MM-DD'
  severity: string; // raw DB severity (mapped to Severity band on render)
};

/** The minimal product signal the matcher needs. */
export type ProductLike = {
  barcode?: string | null;
  brand?: string | null;
  name?: string | null;
};
