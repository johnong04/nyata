import "server-only";
import { withDisclaimers } from "./copy";
import type { VerdictWithCopy } from "./types";

/**
 * GUARDRAIL 3 — the graceful-degradation verdict. Returned (never persisted)
 * whenever the real flow can't complete: OFF miss + no photo, OCR fail, AI fail,
 * or missing API key. Neutral WASPADA / rating 5, no flags, honest summary,
 * with the same legal disclaimers attached as any real verdict. Stubs are never
 * cached, so a later real analysis can replace them.
 */

export type StubReason = "no-product" | "no-key" | "ai-failed";

export function stubVerdict(_reason: StubReason): VerdictWithCopy {
  return withDisclaimers({
    flags: [],
    rating: 5,
    summary_bm:
      "Kami tidak dapat menyiapkan analisis untuk produk ini. Sila cuba lagi.",
    summary_en: "We couldn't complete the analysis for this product — please try again.",
  });
}
