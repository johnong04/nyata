/** One curated, verified hazard row (mirrors the ingredient_hazards table). */
export interface IngredientHazard {
  ingredient: string;
  aliases: string[];
  e_number: string | null;
  kind: "additive" | "sugar_sodium" | "halal_doubtful" | "allergen" | "contaminant";
  classification: string;
  authority: string;
  verbatim_quote: string;
  source_url: string;
  jurisdiction: string;
  severity: "low" | "med" | "high";
}

/** Lookup structures built once from the verified dataset. */
export interface HazardIndex {
  byE: Map<string, IngredientHazard>;    // key: E-number, uppercased, no spaces
  byName: Map<string, IngredientHazard>; // key: normalized ingredient / alias
}
