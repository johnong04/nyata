/**
 * Verdict presentation helpers — the ONE place verdict-band + flag-split logic
 * lives (DRY across stamp, breakdown, and the future share renderer). No I/O,
 * no React. Wraps the canonical band math in `lib/types.ts` so bands never
 * diverge between the seam and the UI.
 */
import type { Flag } from "@/lib/types";
import { bandForRating, glossForBand } from "@/lib/types";

/** Design-system §3 verdict token, lowercased for token/class use. */
export type VerdictToken = "selamat" | "waspada" | "elak";

/** One decimal, e.g. 7.4 / 7.0 — evidence data, rendered in mono. */
export function formatScore(rating: number): string {
  return rating.toFixed(1);
}

/** Band word + EN gloss + lowercase token + formatted score for a 0–10 rating. */
export function ratingToVerdict(rating: number): {
  word: "SELAMAT" | "WASPADA" | "ELAK";
  gloss: string;
  token: VerdictToken;
  score: string;
} {
  const word = bandForRating(rating);
  return {
    word,
    gloss: glossForBand(word),
    token: word.toLowerCase() as VerdictToken,
    score: formatScore(rating),
  };
}

/**
 * S1's Flag severity is low|med|high (nutritional weight), not the verdict
 * trio. Map it to a verdict token so a flag's accent reads on the same
 * safe/wary/avoid scale as the overall stamp.
 */
export function severityToToken(severity: Flag["severity"]): VerdictToken {
  switch (severity) {
    case "high":
      return "elak";
    case "med":
      return "waspada";
    case "low":
      return "selamat";
  }
}

/** Group flags by their mapped verdict token, worst-first order preserved by callers. */
export function splitFlagsBySeverity(flags: Flag[]): {
  elak: Flag[];
  waspada: Flag[];
  selamat: Flag[];
} {
  return {
    elak: flags.filter((f) => severityToToken(f.severity) === "elak"),
    waspada: flags.filter((f) => severityToToken(f.severity) === "waspada"),
    selamat: flags.filter((f) => severityToToken(f.severity) === "selamat"),
  };
}
