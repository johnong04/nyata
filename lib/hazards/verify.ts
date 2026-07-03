/**
 * Pure predicates for the B1 anti-hallucination gate (specs §11.3). A shipped
 * hazard row is kept ONLY if its verbatim_quote is present in the live page
 * text. No I/O here — the network re-fetch lives in scripts/hazards.verify.ts.
 */

/** Strip tags/scripts/styles and collapse whitespace to comparable page text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const norm = (s: string): string => s.replace(/\s+/g, " ").toLowerCase().trim();

/**
 * True iff the (whitespace/case-normalized) quote is a substring of the
 * (whitespace/case-normalized) page text. Conservative: a quote the page does
 * not literally contain is treated as NOT backed → row dropped.
 */
export function quoteBackedBy(pageText: string, quote: string): boolean {
  const q = norm(quote);
  if (q.length < 12) return false; // too short to be a meaningful verbatim quote
  return norm(pageText).includes(q);
}
