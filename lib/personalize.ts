/**
 * Personalization re-flag (specs §11.5). Pure + client-safe — takes an ALREADY
 * generated verdict and returns the subset of its flags relevant to one member's
 * conditions. No AI call, no new verdict: personalization is a filter over facts
 * the verdict engine already produced, so the copy stays ingredient-factual and
 * non-diagnostic (§6). A condition matches a flag by the flag's `kind` and, for
 * allergens, by a keyword test against the flag `name`.
 */
import type { Flag, Verdict, Member, PersonalCondition } from "@/lib/types";

export interface PersonalRisk {
  flag: Flag;
  reasons: PersonalCondition[]; // which of the member's conditions this flag hits
}

/** Allergen chips → keyword test over the flag name (case-insensitive). */
const ALLERGEN_KEYWORDS: Partial<Record<PersonalCondition, RegExp>> = {
  nuts: /\b(nut|peanut|almond|cashew|hazelnut|walnut|pistachio)\b/i,
  dairy: /\b(milk|dairy|lactose|whey|casein|butter|cheese)\b/i,
  gluten: /\b(gluten|wheat|barley|rye|malt)\b/i,
  soy: /\b(soy|soya|soybean)\b/i,
  shellfish: /\b(shrimp|prawn|crab|lobster|shellfish|krill|clam|mussel)\b/i,
};

/** Does one condition consider this flag a risk? */
function conditionHitsFlag(condition: PersonalCondition, flag: Flag): boolean {
  switch (condition) {
    // Metabolic: sugar + sodium share one flag kind in the verdict schema.
    case "diabetic":
    case "hbp":
      return flag.kind === "sugar_sodium";
    // Colours/preservatives/sugar are the kid + pregnancy concern set.
    case "kid":
      return flag.kind === "additive" || flag.kind === "sugar_sodium";
    case "pregnant":
      return (
        flag.kind === "additive" &&
        (flag.severity === "med" || flag.severity === "high")
      );
    // Allergen chips: must be an allergen flag AND match the specific keyword.
    case "nuts":
    case "dairy":
    case "gluten":
    case "soy":
    case "shellfish": {
      if (flag.kind !== "allergen") return false;
      const kw = ALLERGEN_KEYWORDS[condition];
      return kw ? kw.test(flag.name) : false;
    }
  }
}

/**
 * The flags relevant to a member, each annotated with the member's conditions
 * that triggered it. Empty array = no member-specific risk in this verdict.
 */
export function reflagForMember(
  verdict: Verdict,
  member: Member,
): PersonalRisk[] {
  const risks: PersonalRisk[] = [];
  for (const flag of verdict.flags) {
    const reasons = member.conditions.filter((c) => conditionHitsFlag(c, flag));
    if (reasons.length > 0) risks.push({ flag, reasons });
  }
  return risks;
}
