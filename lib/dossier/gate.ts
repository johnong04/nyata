/**
 * B2 credibility gate (specs §11.2) — PURE, no I/O. Enforces the legal hard
 * criteria on dossier sources:
 *  - every kept source has a name + a working-looking URL + a snippet
 *  - URL must be corroborated: its host is in the call's grounded citations OR
 *    in the trusted backstop (a FLOOR, not a fence — the whole web is still
 *    searched; this only decides what may be REPUBLISHED as a claim)
 *  - no private individuals (drop personal handles / anonymous)
 *  - trusted host floors credibility at "med"
 *  - sorted by credibility then recency
 *  - summaries are hedged, never a definitive brand-safety verdict
 */
import type { DossierSource } from "@/lib/types";

/** Trusted backstop — a floor, not a fence. Established news / gov / NGO / journals. */
export const TRUSTED_HOSTS = [
  "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "theguardian.com", "cnn.com",
  "nytimes.com", "channelnewsasia.com", "thestar.com.my", "nst.com.my", "malaymail.com",
  "freemalaysiatoday.com", "thevibes.com", "bernama.com", "who.int", "efsa.europa.eu",
  "fda.gov", "cdc.gov", "nih.gov", "ncbi.nlm.nih.gov", "sciencedirect.com", "nature.com",
  "moh.gov.my", "npra.gov.my", "kpdn.gov.my", "fsis.usda.gov", "food.gov.uk",
];

export function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isTrusted(host: string): boolean {
  return TRUSTED_HOSTS.some((t) => host === t || host.endsWith("." + t));
}

// Names that indicate a private individual / anonymous / social handle → drop.
const PRIVATE_NAME =
  /(^|\b)(reddit user|redditor|@[a-z0-9_]+|anonymous|user\d+|a user|tiktoker|commenter|netizen|facebook user|twitter user|x user)(\b|$)/i;

const RANK: Record<DossierSource["credibility_label"], number> = { high: 0, med: 1, low: 2 };

/**
 * Filter + normalize + sort raw model sources. `groundedHosts` = hostnames from
 * the call's grounded citations (the real search results Google returned).
 */
export function gateSources(
  raw: DossierSource[],
  groundedHosts: Set<string>,
): DossierSource[] {
  const seen = new Set<string>();
  const kept = raw
    .filter((s) => {
      if (!s || !s.source_name || !s.url || !s.verbatim_snippet) return false;
      if (PRIVATE_NAME.test(s.source_name)) return false; // no private individuals
      const h = hostOf(s.url);
      if (!h) return false;
      if (!(groundedHosts.has(h) || isTrusted(h))) return false; // corroboration
      if (seen.has(s.url)) return false;
      seen.add(s.url);
      return true;
    })
    .map((s) => {
      const h = hostOf(s.url);
      // trusted host floors credibility at "med"
      const credibility_label =
        isTrusted(h) && s.credibility_label === "low" ? "med" : s.credibility_label;
      return { ...s, credibility_label };
    });

  return kept.sort(
    (a, b) => RANK[a.credibility_label] - RANK[b.credibility_label] || (b.date || "").localeCompare(a.date || ""),
  );
}

// Definitive brand-safety verbs that must NOT appear unhedged.
const HARD_VERBS =
  /\b(is|are)\s+(unsafe|dangerous|toxic|poisonous|harmful|carcinogenic|illegal)\b|\bcauses?\s+cancer\b|\bwill\s+(harm|hurt|poison)\b/i;
const HEDGE_MARKERS =
  /\b(some sources|reportedly|report(s|ed)?|claim(s|ed)?|allege|may|might|according to|you may wish|has been (linked|associated)|concerns? (have been|about))\b/i;

/**
 * Guarantee a hedged, non-definitive summary. If the model's summary asserts a
 * hard brand-safety verdict OR lacks any hedge marker, replace it with a fixed
 * safe hedge. We never ship a definitive Nyata brand accusation.
 */
export function ensureHedged(summary: string, safeFallback: string): string {
  const s = (summary || "").trim();
  if (!s) return safeFallback;
  if (HARD_VERBS.test(s)) return safeFallback;
  if (!HEDGE_MARKERS.test(s)) return safeFallback;
  return s;
}
