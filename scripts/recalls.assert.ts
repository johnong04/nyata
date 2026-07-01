/**
 * Recall cross-check assertion harness (no test runner in this project).
 * Run: npx tsx scripts/recalls.assert.ts
 *
 * Proves the LEGAL core: the conservative matcher matches a seeded recall to its
 * product AND yields ZERO hits (no accusation) for safe/unrelated products.
 * The ACCEPTANCE rows below mirror the real values seeded in
 * supabase/migrations/*seed_recalls_sample.sql (pre-normalized keys).
 */
import { normalize, tokens, normalizeBarcode } from "../lib/recalls/normalize";
import { matchRecalls } from "../lib/recalls/match";
import type { RecallRow } from "../lib/recalls/types";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failures += 1;
  } else {
    console.log("ok:", msg);
  }
}

// --- normalize -------------------------------------------------------------
assert(
  normalize("Nestlé  MILO®") === "nestle milo",
  "normalize strips diacritics/symbols/case",
);
assert(normalize(null) === "", "normalize null -> empty");
assert(normalize("   ") === "", "normalize whitespace -> empty");
assert(
  JSON.stringify(tokens("Ayam Brand Sardines")) ===
    JSON.stringify(["ayam", "brand", "sardines"]),
  "tokens splits into words",
);
assert(
  normalizeBarcode("978-3 16 148410-0") === "9783161484100",
  "normalizeBarcode keeps digits only",
);

// --- matcher: row factory --------------------------------------------------
const row = (o: Partial<RecallRow>): RecallRow => ({
  source: "NPRA Malaysia",
  matchBarcode: null,
  matchBrand: null,
  matchProduct: null,
  title: "T",
  officialUrl: "https://example.gov.my",
  date: "2024-01-01",
  severity: "high",
  ...o,
});

// --- matcher: POSITIVE cases ----------------------------------------------
const barcodeRow = row({ matchBarcode: "9556003300031" });
assert(
  matchRecalls({ barcode: "955-6003-300031" }, [barcodeRow]).length === 1,
  "matches on exact barcode (digits normalized)",
);

const ikeaRow = row({ matchBrand: "ikea", matchProduct: "garlic press" });
assert(
  matchRecalls(
    { brand: "IKEA", name: "IKEA 365+ VÄRDEFULL Garlic Press" },
    [ikeaRow],
  ).length === 1,
  "matches on brand + product corroboration",
);

// --- matcher: NEGATIVE cases (the legal core — false-positive guards) ------
assert(
  matchRecalls({ barcode: "0000000000000" }, [barcodeRow]).length === 0,
  "different barcode does NOT match",
);
// brand aligns but product does not -> no match (never brand-alone)
assert(
  matchRecalls({ brand: "IKEA", name: "BILLY Bookcase" }, [ikeaRow]).length ===
    0,
  "brand-only (no product corroboration) does NOT match",
);
// single shared common word must never match
const milkRow = row({ matchBrand: "somebrand", matchProduct: "milk powder" });
assert(
  matchRecalls({ brand: "Dutch Lady", name: "Fresh Milk 1L" }, [milkRow])
    .length === 0,
  "single shared common word does NOT match (conservative)",
);
// token-boundary: "milo" must not match inside "milong"
const miloRow = row({ matchBrand: "nestle", matchProduct: "milo" });
assert(
  matchRecalls({ brand: "Nestle", name: "Milong drink" }, [miloRow]).length ===
    0,
  "substring inside a longer token does NOT match (token boundary)",
);
assert(
  matchRecalls({ brand: "", name: "" }, [ikeaRow, barcodeRow]).length === 0,
  "empty product -> zero hits",
);
assert(
  matchRecalls({ brand: "IKEA", name: "Garlic Press" }, []).length === 0,
  "empty recalls table -> zero hits (== graceful getRecallsForProduct fallback)",
);

// --- ACCEPTANCE: mirrors the real seeded rows ------------------------------
// (values copied literally from supabase/migrations/*_seed_recalls_sample.sql)
const seededIkea = row({
  source: "KPDN",
  matchBrand: "ikea",
  matchProduct: "garlic press",
  title:
    "IKEA 365+ VÄRDEFULL Garlic Press — voluntary recall (risk of metal pieces detaching)",
  officialUrl: "https://mysafe.kpdn.gov.my/portal/post/3",
  date: "2025-06-12",
  severity: "high",
});
const seededNpra = row({
  source: "NPRA",
  matchProduct: "proluton depot",
  matchBrand: "bayer",
  title:
    "17-Hydroxyprogesterone Caproate (17-OHPC): Cancellation of Product Registration and Product Recall",
  officialUrl:
    "https://www.npra.gov.my/index.php/en/component/content/article/454-english/safety-alerts-main/safety-alerts-2024/1527659-updated-17-hydroxyprogesterone-caproate-17-ohpc-cancellation-of-product-registration-and-product-recall.html",
  date: "2024-10-03",
  severity: "high",
});

// ACCEPTANCE 1: seeded recall matches its product (as the label reads)
assert(
  matchRecalls(
    { brand: "IKEA", name: "IKEA 365+ VÄRDEFULL Garlic Press" },
    [seededIkea, seededNpra],
  ).length === 1,
  "ACCEPTANCE: seeded IKEA garlic-press recall matches its product",
);
assert(
  matchRecalls(
    { brand: "Bayer", name: "Proluton Depot 250mg Injection" },
    [seededIkea, seededNpra],
  ).length === 1,
  "ACCEPTANCE: seeded NPRA Proluton Depot recall matches its product",
);
// ACCEPTANCE 2: a clearly-safe unrelated product yields ZERO accusation
assert(
  matchRecalls(
    { brand: "Gardenia", name: "Original Classic Bread 400g" },
    [seededIkea, seededNpra],
  ).length === 0,
  "ACCEPTANCE: non-recalled product yields NO accusation",
);

// --- verify the matched hit carries a source quote + link ------------------
const [hit] = matchRecalls(
  { brand: "IKEA", name: "IKEA 365+ VÄRDEFULL Garlic Press" },
  [seededIkea],
);
assert(
  Boolean(hit && hit.source && hit.title && hit.officialUrl.startsWith("https://")),
  "matched hit exposes source + title + live official_url for citation",
);

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll recall cross-check assertions passed.");
