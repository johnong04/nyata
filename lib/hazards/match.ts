import { normalize } from "@/lib/recalls/normalize";
import type { HazardIndex, IngredientHazard } from "./types";

const eKey = (e: string): string => e.toUpperCase().replace(/\s+/g, "");

/** Build E-number + name/alias lookup maps from the verified dataset (once). */
export function indexHazards(rows: IngredientHazard[]): HazardIndex {
  const byE = new Map<string, IngredientHazard>();
  const byName = new Map<string, IngredientHazard>();
  for (const h of rows) {
    if (h.e_number) byE.set(eKey(h.e_number), h);
    for (const n of [h.ingredient, ...h.aliases]) {
      const k = normalize(n);
      if (k) byName.set(k, h);
    }
  }
  return { byE, byName };
}

/** Find the verified hazard row for a flag by E-number, else by normalized name. */
export function hazardForFlag(
  flag: { e_number?: string; name: string },
  idx: HazardIndex,
): IngredientHazard | null {
  if (flag.e_number) {
    const h = idx.byE.get(eKey(flag.e_number));
    if (h) return h;
  }
  return idx.byName.get(normalize(flag.name)) ?? null;
}
