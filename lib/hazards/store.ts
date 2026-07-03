import "server-only";
import type { IngredientHazard } from "./types";
import verified from "./data/ingredient-hazards.verified.json";

/**
 * The verified hazard dataset, bundled at build time.
 *
 * // DECISION: the verdict engine grounds on the SAME verified bytes the loader
 * // (scripts/hazards.load.ts) writes to the ingredient_hazards table, so the
 * // table (auditable source of record, §11.3) and the hot-path grounding data
 * // cannot drift, and the verdict path needs no per-request DB round-trip.
 * // Degrades to [] if the file is somehow empty → enrichment/grounding no-op.
 */
export function getHazards(): IngredientHazard[] {
  return (verified as IngredientHazard[]) ?? [];
}
