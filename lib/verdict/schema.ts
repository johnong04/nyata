import { z } from "zod";

/**
 * GUARDRAIL 1 — the STRICT schema the AI verdict must satisfy before we trust
 * or persist it. Mirrors the `@/lib/types` `Flag` / `Verdict` shapes (the seam),
 * NOT a private fork. `.strict()` rejects any extra keys the model hallucinates.
 *
 * Disclaimers are deliberately NOT in this schema — legal copy is ours, attached
 * post-validation (see copy.ts). The model authors facts, never the caveat.
 */

export const flagSchema = z
  .object({
    e_number: z.string().min(1).optional(),
    name: z.string().min(1),
    kind: z.enum(["additive", "sugar_sodium", "halal_doubtful", "allergen"]),
    note_bm: z.string().min(1),
    note_en: z.string().min(1),
    severity: z.enum(["low", "med", "high"]),
  })
  .strict();

export const verdictModelSchema = z
  .object({
    flags: z.array(flagSchema),
    rating: z.number().min(0).max(10),
    summary_bm: z.string().min(1),
    summary_en: z.string().min(1),
  })
  .strict();

export type VerdictModel = z.infer<typeof verdictModelSchema>;

/** Schema for the OCR fallback: just the raw ingredient text lifted off a label. */
export const ocrSchema = z
  .object({
    ingredients_text: z.string(),
  })
  .strict();
