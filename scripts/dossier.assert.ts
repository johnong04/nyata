/**
 * CI-provable proof of the B2 credibility gate (no network/AI/DB):
 *  - a source whose host is neither grounded nor trusted is DROPPED
 *  - a private-individual source_name is DROPPED
 *  - a trusted host FLOORS credibility at "med"
 *  - kept sources are sorted by credibility then recency
 *  - ensureHedged replaces a hard verdict / an unhedged summary with the fallback
 * Run: npx tsx scripts/dossier.assert.ts
 */
import { gateSources, ensureHedged, isTrusted, hostOf } from "../lib/dossier/gate";
import type { DossierSource } from "../lib/types";

let failures = 0;
const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error("FAIL:", msg); failures++; } else console.log("ok:", msg);
};

const src = (o: Partial<DossierSource>): DossierSource => ({
  source_name: "Reuters", credibility_label: "high", verbatim_snippet: "quoted text here",
  url: "https://www.reuters.com/article/x", date: "2026-05-01", ...o,
});

assert(hostOf("https://www.thestar.com.my/news") === "thestar.com.my", "hostOf strips www");
assert(isTrusted("thestar.com.my") && !isTrusted("randomblog.xyz"), "isTrusted floor list");

// grounded hosts from the (fake) grounded citation set
const grounded = new Set(["nst.com.my"]);

// 1. untrusted + ungrounded host -> dropped
assert(
  gateSources([src({ source_name: "Some Blog", url: "https://randomblog.xyz/p" })], grounded).length === 0,
  "untrusted + ungrounded source dropped",
);
// 2. grounded host survives even if not on the trusted list
assert(
  gateSources([src({ source_name: "NST", url: "https://nst.com.my/news/1" })], grounded).length === 1,
  "grounded-host source kept",
);
// 3. private individual dropped even on a trusted host
assert(
  gateSources([src({ source_name: "@johndoe", url: "https://www.reuters.com/x" })], grounded).length === 0,
  "private-individual name dropped",
);
assert(
  gateSources([src({ source_name: "Reddit user", url: "https://www.bbc.com/x" })], grounded).length === 0,
  "anonymous social name dropped",
);
// 4. trusted host floors low -> med
const floored = gateSources([src({ credibility_label: "low", url: "https://www.bbc.com/x" })], grounded);
assert(floored.length === 1 && floored[0].credibility_label === "med", "trusted host floors credibility to med");
// 5. sort by credibility then recency
const sorted = gateSources(
  [
    src({ source_name: "A", url: "https://www.bbc.com/a", credibility_label: "med", date: "2026-01-01" }),
    src({ source_name: "B", url: "https://www.reuters.com/b", credibility_label: "high", date: "2020-01-01" }),
    src({ source_name: "C", url: "https://www.cnn.com/c", credibility_label: "med", date: "2026-06-01" }),
  ],
  grounded,
);
assert(sorted.map((s) => s.source_name).join("") === "BCA", "sorted by credibility then recency");

// 6. ensureHedged
assert(ensureHedged("Brand X is unsafe and causes cancer.", "SAFE") === "SAFE", "hard verdict replaced");
assert(ensureHedged("A neutral factual line with no hedge.", "SAFE") === "SAFE", "unhedged summary replaced");
assert(
  ensureHedged("Some sources report concerns about additives.", "SAFE").startsWith("Some sources"),
  "properly hedged summary kept",
);

if (failures > 0) { console.error(`\n${failures} assertion(s) FAILED`); process.exit(1); }
console.log("\nAll B2 dossier gate assertions passed.");
