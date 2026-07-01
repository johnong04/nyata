/**
 * Runnable proof of GUARDRAIL 1 (validate-before-trust). Pure — no network, no
 * AI, no DB. Asserts the strict Zod schema REJECTS a malformed AI object and
 * ACCEPTS a well-formed one. Exits 1 on any wrong outcome.
 *
 * Run: npx tsx scripts/check-verdict-guardrail.ts
 */
import { verdictModelSchema } from "../lib/verdict/schema";

let failures = 0;
function check(name: string, pass: boolean) {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}`);
  if (!pass) failures++;
}

// --- malformed objects that MUST be rejected ---
const badRating = { flags: [], rating: 99, summary_bm: "x", summary_en: "x" };
check("rejects out-of-range rating (99)", !verdictModelSchema.safeParse(badRating).success);

const badEnum = {
  flags: [],
  rating: 5,
  summary_bm: "x",
  summary_en: "x",
  extra: "MAYBE",
};
check("rejects extra key (strict)", !verdictModelSchema.safeParse(badEnum).success);

const badFlagKind = {
  flags: [{ name: "X", kind: "poison", note_bm: "a", note_en: "b", severity: "high" }],
  rating: 5,
  summary_bm: "x",
  summary_en: "x",
};
check("rejects invalid flag kind", !verdictModelSchema.safeParse(badFlagKind).success);

const missingField = { flags: [], rating: 5, summary_en: "x" };
check("rejects missing summary_bm", !verdictModelSchema.safeParse(missingField).success);

const emptyString = { flags: [], rating: 5, summary_bm: "", summary_en: "x" };
check("rejects empty summary_bm (min 1)", !verdictModelSchema.safeParse(emptyString).success);

// --- a well-formed object that MUST pass ---
const good = {
  flags: [
    {
      e_number: "E621",
      name: "MSG",
      kind: "additive",
      note_bm: "Penambah perisa.",
      note_en: "Flavour enhancer.",
      severity: "med",
    },
  ],
  rating: 6.2,
  summary_bm: "Mengandungi bahan tambahan.",
  summary_en: "Contains additives.",
};
check("accepts a well-formed verdict", verdictModelSchema.safeParse(good).success);

if (failures > 0) {
  console.error(`\n${failures} guardrail check(s) FAILED`);
  process.exit(1);
}
console.log("\nAll guardrail checks passed.");
