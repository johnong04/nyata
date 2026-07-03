import type { Flag } from "@/lib/types";
import type { IngredientHazard } from "./types";
import { hazardForFlag, indexHazards } from "./match";

/**
 * Attach the verified B1 citation to any flag that matches a hazard row. The
 * model authored the flag; the CITATION (authority/jurisdiction/quote/url) is
 * ours, from the verified table (specs §11.3). CRITICAL: this NEVER touches the
 * rating — it only decorates flags. Rating stays ingredient-model-authored.
 */
export function enrichFlagsWithJurisdiction(
  flags: Flag[],
  rows: IngredientHazard[],
): Flag[] {
  if (rows.length === 0) return flags;
  const idx = indexHazards(rows);
  return flags.map((f) => {
    const h = hazardForFlag(f, idx);
    if (!h) return f;
    return {
      ...f,
      jurisdiction: {
        authority: h.authority,
        jurisdiction: h.jurisdiction,
        status: h.classification,
        verbatim_quote: h.verbatim_quote,
        source_url: h.source_url,
      },
    };
  });
}
