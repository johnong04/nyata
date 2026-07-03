/**
 * Build-time pre-warm of the dossiers table for popular MY brands so common
 * scans are INSTANT + free at runtime (specs §11.3). Two-part per brand:
 *  1. the SAME runtime grounded web call (fetchDossier) — the baseline dossier,
 *  2. OPTIONAL richer "what social/health channels say" rows appended by the
 *     executor via the last30days skill (see Step 2) — attributed + gated.
 * The runtime path stays web-only; social depth is ONLY these pre-warmed brands.
 *
 * Run: npx tsx --env-file=.env.local scripts/dossiers.prewarm.ts
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { normalize } from "../lib/recalls/normalize";
import { fetchDossier } from "../lib/dossier/gemini";
import { upsertDossier } from "../lib/dossier/cache";

interface BrandEntry { brand: string; name: string; }

async function main() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("FAIL: GOOGLE_GENERATIVE_AI_API_KEY not set.");
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
    await upsertDossier({ ...dossier, prewarmed: true }, { model: "gemini-2.5-flash+prewarm" });
    warmed++;
    console.log("warmed:", b.brand, `(${dossier.sources.length} sources)`);
    await new Promise((r) => setTimeout(r, 1500)); // gentle on quota
  }
  console.log(`\nPre-warmed ${warmed}/${brands.length} brands.`);
}

main();
