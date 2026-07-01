/**
 * Share-card metadata — the ONE place the flat export derives its presentation
 * from the S1 seam types. No I/O, no React (Satori tree lives in buildShareCard).
 *
 * Deviation from the S4 plan's assumed shape: S1 landed `Verdict` as
 * `{ flags, rating, summary_bm, summary_en }` (lib/types.ts), NOT the plan's
 * `{ state, score, hazards, recall }`. So we derive band/word/color/score from
 * `rating` via the canonical `ratingToVerdict`, and map `Flag[]` → hazard rows
 * here. Recall comes separately from `getRecallsForProduct` (Recall[]).
 */
import type { Flag, Recall, Verdict } from "@/lib/types";
import { ratingToVerdict, type VerdictToken } from "@/lib/verdict-ui";

/** Verdict token → hex, copied verbatim from design-system §2 tokens. */
const COLOR: Record<VerdictToken, string> = {
  selamat: "#1E874B", // --color-selamat
  waspada: "#E08A00", // --color-waspada
  elak: "#D33118", // --color-elak
};
const COLOR_BG: Record<VerdictToken, string> = {
  selamat: "#E7F2EA", // --color-selamat-bg
  waspada: "#FBF0DC", // --color-waspada-bg
  elak: "#FBE6E1", // --color-elak-bg
};

export function verdictColor(token: VerdictToken): string {
  return COLOR[token];
}
export function verdictColorBg(token: VerdictToken): string {
  return COLOR_BG[token];
}

/** The verdict word / gloss / token / score for a rating (canonical helper). */
export { ratingToVerdict };

/**
 * Flat hazard rows for the card. Preserves seam order (callers already sort
 * worst-first). Each row: E-number (or "—"), name, short bilingual flag, and
 * the flag's verdict token for the accent dot.
 */
export interface HazardRow {
  code: string;
  name: string;
  flag: string;
  token: VerdictToken;
}

/** Human flag label per kind — bilingual, sentence-case (design-system §9). */
const KIND_FLAG: Record<Flag["kind"], string> = {
  additive: "bahan tambahan · additive",
  sugar_sodium: "gula/garam · sugar/sodium",
  halal_doubtful: "halal diragui · verify JAKIM",
  allergen: "alergen · allergen",
};

const SEVERITY_TOKEN: Record<Flag["severity"], VerdictToken> = {
  high: "elak",
  med: "waspada",
  low: "selamat",
};

export function toHazardRows(flags: Flag[]): HazardRow[] {
  return flags.map((f) => ({
    code: f.e_number ?? "—",
    name: f.name,
    flag: KIND_FLAG[f.kind],
    token: SEVERITY_TOKEN[f.severity],
  }));
}

/**
 * The single recall citation the card quotes, or null. LEGAL (specs §6,
 * design-system §9): official-source only, quoted title + source + date + link.
 * We surface just the first (highest-severity) recall; never fabricate.
 */
export function primaryRecall(recalls: Recall[]): Recall | null {
  return recalls[0] ?? null;
}

/** ISO date → readable "14 May 2026" for the citation line. */
export function formatRecallDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Deep link back to the product page — the call that drives the users axis. */
export function deepLink(barcode: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://nyata.app";
  return `${base.replace(/\/$/, "")}/product/${encodeURIComponent(barcode)}`;
}

/** Everything the card needs, resolved from the seam in one shape. */
export interface ShareCardData {
  barcode: string;
  productName: string;
  brand: string;
  verdict: Verdict;
  recall: Recall | null;
}
