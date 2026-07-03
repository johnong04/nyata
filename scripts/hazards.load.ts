/**
 * Load the VERIFIED hazard dataset into public.ingredient_hazards via the
 * service-role client (writes past RLS). Idempotent: upsert on (ingredient,
 * source_url). Only runs on the verify pass output — never the raw file.
 *
 * Run: npx tsx --env-file=.env.local scripts/hazards.load.ts
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createServiceClient } from "../utils/supabase/service";
import type { IngredientHazard } from "../lib/hazards/types";

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("FAIL: Supabase env not set (need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY).");
    process.exit(1);
  }
  const rows = JSON.parse(
    await readFile(
      join(process.cwd(), "lib", "hazards", "data", "ingredient-hazards.verified.json"),
      "utf8",
    ),
  ) as (IngredientHazard & { verified_at?: string })[];

  const supabase = createServiceClient();
  const payload = rows.map((r) => ({
    ingredient: r.ingredient,
    aliases: r.aliases ?? [],
    e_number: r.e_number,
    kind: r.kind,
    classification: r.classification,
    authority: r.authority,
    verbatim_quote: r.verbatim_quote,
    source_url: r.source_url,
    jurisdiction: r.jurisdiction,
    severity: r.severity,
    verified_at: r.verified_at ?? new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("ingredient_hazards")
    .upsert(payload, { onConflict: "ingredient,source_url" });
  if (error) {
    console.error("FAIL: upsert error:", error.message);
    process.exit(1);
  }
  console.log(`Loaded ${payload.length} verified hazard rows.`);
}

main();
