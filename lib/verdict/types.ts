import "server-only";

/**
 * Verdict-engine types. The canonical domain shapes (`Product`, `Flag`,
 * `Verdict`, `Rating`) live in `@/lib/types` — the seam S13 depends on. This
 * module ALIGNS to those; it does not fork them.
 *
 * The only addition is the runtime-attached guardrail copy (`disclaimer_bm/en`):
 * fixed legal strings we author (never the model), attached to every returned
 * verdict. They are NOT persisted (the `verdicts` table has no such columns) —
 * they are re-attached on every read from `lib/verdict/copy.ts`, so the copy can
 * be corrected app-wide without a data migration.
 */
import type { Flag, Product, Verdict, VerdictBand } from "@/lib/types";

export type { Flag, Product, Verdict, VerdictBand };

/** A verdict plus the load-bearing legal disclaimer copy (ours, not the model's). */
export interface VerdictWithCopy extends Verdict {
  band: VerdictBand;
  disclaimer_bm: string;
  disclaimer_en: string;
}
