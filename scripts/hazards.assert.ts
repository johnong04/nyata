/**
 * CI-provable proof of the B1 pure logic (no network/AI/DB):
 *  - quoteBackedBy accepts a present quote, rejects an absent/too-short one
 *  - htmlToText strips tags
 *  - the matcher matches by E-number and by normalized name/alias
 *  - enrichment attaches the verified citation to a matching flag ONLY, and
 *    NEVER changes any other flag field
 * Run: npx tsx scripts/hazards.assert.ts
 */
import { htmlToText, quoteBackedBy } from "../lib/hazards/verify";
import { indexHazards, hazardForFlag } from "../lib/hazards/match";
import { enrichFlagsWithJurisdiction } from "../lib/hazards/enrich";
import type { IngredientHazard } from "../lib/hazards/types";
import type { Flag } from "../lib/types";

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error("FAIL:", msg); failures++; } else console.log("ok:", msg);
};

// --- verify predicate ---
const page = htmlToText("<p>Titanium dioxide (E171) is <b>no longer</b> considered safe.</p>");
assert(page === "Titanium dioxide (E171) is no longer considered safe.", "htmlToText strips tags + collapses ws");
assert(quoteBackedBy(page, "no longer considered safe"), "quoteBackedBy accepts a present quote");
assert(!quoteBackedBy(page, "banned worldwide immediately"), "quoteBackedBy rejects an absent quote");
assert(!quoteBackedBy(page, "E171"), "quoteBackedBy rejects a too-short quote (<12 chars)");

// --- matcher ---
const rows: IngredientHazard[] = [
  {
    ingredient: "Titanium dioxide", aliases: ["titanium dioxide", "colour e171"], e_number: "E171",
    kind: "additive", classification: "no longer considered safe as a food additive (EFSA 2021)",
    authority: "EFSA", verbatim_quote: "no longer considered safe when used as a food additive",
    source_url: "https://www.efsa.europa.eu/en/news/titanium-dioxide-e171-no-longer-considered-safe",
    jurisdiction: "Permitted in Malaysia; banned in the EU (2022)", severity: "high",
  },
];
const idx = indexHazards(rows);
assert(hazardForFlag({ e_number: "E171", name: "Colour" }, idx)?.ingredient === "Titanium dioxide", "matches by E-number");
assert(hazardForFlag({ name: "Titanium Dioxide" }, idx)?.e_number === "E171", "matches by normalized name");
assert(hazardForFlag({ name: "colour e171" }, idx)?.e_number === "E171", "matches by alias");
assert(hazardForFlag({ name: "sugar" }, idx) === null, "non-hazard ingredient does not match");

// --- enrichment ---
const flags: Flag[] = [
  { e_number: "E171", name: "Titanium dioxide", kind: "additive", note_bm: "x", note_en: "y", severity: "med" },
  { name: "Sugar", kind: "sugar_sodium", note_bm: "a", note_en: "b", severity: "low" },
];
const enriched = enrichFlagsWithJurisdiction(flags, rows);
assert(enriched[0].jurisdiction?.authority === "EFSA", "enrichment attaches citation to the matching flag");
assert(enriched[0].jurisdiction?.source_url.startsWith("https://") === true, "citation carries a working link");
assert(enriched[0].severity === "med" && enriched[0].note_en === "y", "enrichment does NOT change other flag fields");
assert(enriched[1].jurisdiction === undefined, "enrichment leaves a non-matching flag untouched");
assert(enrichFlagsWithJurisdiction(flags, []).every((f) => f.jurisdiction === undefined), "empty dataset -> no-op (graceful)");

if (failures > 0) { console.error(`\n${failures} assertion(s) FAILED`); process.exit(1); }
console.log("\nAll B1 hazard assertions passed.");
