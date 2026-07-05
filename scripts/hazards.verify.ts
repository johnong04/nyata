/**
 * B1 anti-hallucination verify pass (specs §11.3). Re-fetches EVERY row's
 * source_url and keeps the row ONLY if the page is live (HTTP 200) AND its
 * verbatim_quote is present in the page text. Dropped rows are logged. Output:
 * lib/hazards/data/ingredient-hazards.verified.json (only rows that passed).
 *
 * Run: npx tsx --env-file=.env.local scripts/hazards.verify.ts
 * (env not required here, but keep the invocation uniform.)
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { htmlToText, quoteBackedBy } from "../lib/hazards/verify";
import type { IngredientHazard } from "../lib/hazards/types";

const DIR = join(process.cwd(), "lib", "hazards", "data");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/125.0 Safari/537.36 Nyata-verify/0.1";

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(20000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return htmlToText(await res.text());
  } catch {
    return null;
  }
}

async function main() {
  const raw = JSON.parse(
    await readFile(join(DIR, "ingredient-hazards.raw.json"), "utf8"),
  ) as IngredientHazard[];

  const kept: IngredientHazard[] = [];
  const dropped: { ingredient: string; reason: string; url: string }[] = [];
  const now = new Date().toISOString();

  for (const row of raw) {
    const text = await fetchText(row.source_url);
    if (text === null) {
      dropped.push({ ingredient: row.ingredient, reason: "unreachable/non-200", url: row.source_url });
      continue;
    }
    if (!quoteBackedBy(text, row.verbatim_quote)) {
      dropped.push({ ingredient: row.ingredient, reason: "quote-not-on-page", url: row.source_url });
      continue;
    }
    kept.push({ ...row, verified_at: now } as IngredientHazard & { verified_at: string });
    console.log("KEPT ", row.ingredient, "—", row.source_url);
  }

  for (const d of dropped) console.warn("DROP ", d.ingredient, `(${d.reason})`, d.url);

  await writeFile(
    join(DIR, "ingredient-hazards.verified.json"),
    JSON.stringify(kept, null, 2) + "\n",
    "utf8",
  );
  console.log(`\nVerified ${kept.length}/${raw.length} rows kept, ${dropped.length} dropped.`);
  if (kept.length < 25) {
    console.error("FAIL: fewer than 25 verified rows — research more before shipping.");
    process.exit(1);
  }
}

main();
