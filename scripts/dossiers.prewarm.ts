/**
 * Build-time pre-warm of the dossiers table for popular MY brands so common
 * scans are INSTANT + free at runtime (specs §11.3). Two-part per brand:
 *  1. the SAME runtime web call (fetchDossier — OpenRouter web plugin) — the
 *     baseline dossier,
 *  2. OPTIONAL richer "what social/health channels say" rows appended by the
 *     executor via the last30days skill (see Step 2) — attributed + gated.
 * The runtime path stays web-only; social depth is ONLY these pre-warmed brands.
 *
 * COST: this spends OpenRouter credits (~$0.03/brand). Env-gated — only runs
 * when OPENROUTER_API_KEY is set. Run manually when you intend to spend:
 *   npx tsx --env-file=.env.local scripts/dossiers.prewarm.ts
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalize } from "../lib/recalls/normalize";
import { fetchDossier } from "../lib/dossier/openrouter";
import { upsertDossier } from "../lib/dossier/cache";

interface BrandEntry { brand: string; name: string; }

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("FAIL: OPENROUTER_API_KEY not set.");
    process.exit(1);
  }
  const brands = JSON.parse(
    await readFile(join(process.cwd(), "lib", "dossier", "data", "popular-brands.json"), "utf8"),
  ) as BrandEntry[];

  let warmed = 0;
  for (const b of brands) {
    const key = normalize(b.brand) || normalize(b.name);
    if (!key) continue;
    const dossier = await fetchDossier({ brand: b.brand, name: b.name });
    if (!dossier) { console.warn("skip (no gated source):", b.brand); continue; }
    await upsertDossier({ ...dossier, prewarmed: true }, { model: "openrouter:google/gemini-2.5-flash+web+prewarm" });
    warmed++;
    console.log("warmed:", b.brand, `(${dossier.sources.length} sources)`);
    await new Promise((r) => setTimeout(r, 1500)); // gentle on quota
  }
  console.log(`\nPre-warmed ${warmed}/${brands.length} brands.`);
}

main();
