import { z } from "zod";

/** Strict schema for the JSON the grounded model is asked to emit. */
export const dossierRawSchema = z
  .object({
    summary_en: z.string(),
    summary_bm: z.string(),
    sources: z.array(
      z
        .object({
          source_name: z.string(),
          credibility_label: z.enum(["high", "med", "low"]),
          verbatim_snippet: z.string(),
          url: z.string(),
          date: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

export type DossierRaw = z.infer<typeof dossierRawSchema>;
