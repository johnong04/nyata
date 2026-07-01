import "server-only";
import type { Flag, Verdict } from "@/lib/types";
import { bandForRating } from "@/lib/types";
import type { VerdictWithCopy } from "./types";

/**
 * GUARDRAIL 2 — legal framing is OURS, never the model's.
 *
 * Fixed disclaimer strings (BM + EN), authored here, attached to EVERY verdict
 * (real or stub). Ingredient FACTS, not medical advice. Halal-doubtful flags are
 * normalized to carry the "verify with JAKIM" framing regardless of what the
 * model wrote (specs §6). The model is never allowed to author legal copy.
 */

export const DISCLAIMER_EN =
  "Informational only — ingredient facts, not medical advice or diagnosis.";
export const DISCLAIMER_BM =
  "Maklumat sahaja — fakta ramuan, bukan nasihat perubatan atau diagnosis.";

const JAKIM_EN = "verify halal status with JAKIM";
const JAKIM_BM = "sahkan status halal dengan JAKIM";

/**
 * Ensure every halal-doubtful flag's notes carry the JAKIM framing. If the
 * model omitted it, append our fixed clause — we never trust the model to have
 * authored the load-bearing halal caveat.
 */
export function normalizeHalalFlags(flags: Flag[]): Flag[] {
  return flags.map((f) => {
    if (f.kind !== "halal_doubtful") return f;
    const en = /jakim/i.test(f.note_en) ? f.note_en : `${f.note_en} — ${JAKIM_EN}.`;
    const bm = /jakim/i.test(f.note_bm) ? f.note_bm : `${f.note_bm} — ${JAKIM_BM}.`;
    return { ...f, note_en: en, note_bm: bm };
  });
}

/** Attach the fixed guardrail copy + derived band to a bare verdict. */
export function withDisclaimers(v: Verdict): VerdictWithCopy {
  return {
    ...v,
    flags: normalizeHalalFlags(v.flags),
    band: bandForRating(v.rating),
    disclaimer_bm: DISCLAIMER_BM,
    disclaimer_en: DISCLAIMER_EN,
  };
}
