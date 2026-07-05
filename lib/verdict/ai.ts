import "server-only";
import { generateObject } from "ai";
import type { Product } from "@/lib/types";
import { getHazards } from "@/lib/hazards/store";
import { normalize } from "@/lib/recalls/normalize";
import { verdictModelSchema, type VerdictModel } from "./schema";
import { aiModel, OCR_MODEL_ID } from "./model";

/**
 * GUARDRAIL 1 — AI verdict with validate-before-trust.
 *
 * Calls AI SDK 6 `generateObject` (top-level `schema`, the v6 shape — not the
 * v3/v4 messages form) against gemini-2.5-flash, then RE-VALIDATES the result
 * with `verdictModelSchema.safeParse`. On failure: one retry with a stricter
 * nudge; second failure throws `VerdictSchemaError` (caught upstream → stub).
 * We never return an unvalidated object. Disclaimers/halal-normalization are
 * applied by the caller (copy.ts) — this file authors FACTS only.
 */

export const MODEL_ID = OCR_MODEL_ID;

export class VerdictSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VerdictSchemaError";
  }
}

const SYSTEM_PROMPT = `You are a food-additive analyst for Malaysian consumers. Given a product's ingredient list, produce a factual, non-alarmist verdict.

RULES:
- Report ingredient FACTS only. Never give medical advice, diagnosis, or health claims.
- Flag ingredients into exactly one "kind":
  - "additive": E-numbers, synthetic colours, preservatives, flavour enhancers.
  - "sugar_sodium": added sugar or sodium present in notable amounts.
  - "halal_doubtful": ingredients of unclear animal/alcohol origin (gelatine, emulsifiers E471/E472, enzymes, mono-/di-glycerides, shortening, rennet, etc.). The note MUST say the status is unclear and to verify with JAKIM. Never declare anything haram or halal yourself.
  - "allergen": common allergens (nuts, soy, milk, egg, wheat/gluten, shellfish).
- Every flag has: "name" (ingredient as written), optional "e_number", a short factual "note_en" and "note_bm" (Bahasa Melayu), and a "severity".

SEVERITY (per flag):
  - "high": ONLY for additives carrying an adverse regulatory classification (see KNOWN REGULATORY FACTS below — e.g. banned or restricted in a major jurisdiction), OR sugar/salt that is a PRIMARY ingredient of a clearly sweet or salty product.
  - "med": permitted additives worth noting, or added sugar/salt that is a notable but non-primary ingredient.
  - "low": benign, generally-recognised-as-safe additives (e.g. acidity regulators such as sodium acetate or fumaric acid), minor/incidental sugar or salt — AND ALL common allergens.
  Amounts are usually not given: judge sugar/salt by PROMINENCE (position in the list) and product type. Do NOT inflate a staple food just because it lists some sugar or salt.

RATING (0-10, higher = worse) reflects ADDITIVE, SUGAR/SODIUM and PROCESSING concern ONLY. Common allergens are INFORMATIONAL and MUST NOT raise it. Calibrate against these anchors:
  - Plain staple (bread, sandwich, plain biscuit) — flour/egg/milk, benign regulators, minor sugar/salt → 2-3 (mostly safe).
  - Everyday processed food with a few permitted additives or moderate sugar/salt → 4-5.
  - Instant noodles / heavily-flavoured snack — palm oil, MSG (E621), high sodium, several additives → 6-7.
  - Sugary drink or candy (sugar as a first ingredient), a synthetic colour, or ANY ingredient adverse-classified in KNOWN REGULATORY FACTS → 7-9.
  Bands: 0-3.9 mostly safe · 4-6.9 some caution · 7-10 serious.
- Allergen flags exist to warn allergic users — they say WHO should avoid the product, not whether it is generally concerning.
- "summary_en" and "summary_bm": one or two plain, neutral sentences. Not diagnostic.
- Return ONLY fields defined by the schema. No extra keys.`;

/** Hazard rows whose ingredient/alias literally appears in the product's ingredients. */
function groundingRows(product: Product) {
  const hay = normalize(product.ingredients_raw);
  if (!hay) return [];
  return getHazards().filter((h) =>
    [h.ingredient, ...h.aliases].some((n) => {
      const k = normalize(n);
      return k.length > 2 && hay.includes(k);
    }),
  );
}

function buildPrompt(product: Product): string {
  const grounded = groundingRows(product);
  const groundingBlock =
    grounded.length === 0
      ? ""
      : [
          "",
          "KNOWN REGULATORY FACTS for ingredients in THIS product (authoritative — use them; do not contradict):",
          ...grounded.map(
            (h) =>
              `- ${h.ingredient}${h.e_number ? ` (${h.e_number})` : ""}: ${h.classification} — ${h.authority}. ${h.jurisdiction}`,
          ),
        ].join("\n");

  return [
    `Product: ${product.name || "(unknown)"}`,
    `Brand: ${product.brand || "(unknown)"}`,
    `Ingredients: ${product.ingredients_raw || "(none provided)"}`,
    groundingBlock,
    "",
    "Analyse the ingredients and return the verdict object. When a known regulatory fact above applies to an ingredient, FLAG that ingredient (matching name/e_number) so its citation can be attached.",
  ].join("\n");
}

async function callModel(prompt: string, retryNudge = false): Promise<unknown> {
  const result = await generateObject({
    model: aiModel(),
    schema: verdictModelSchema,
    system: retryNudge
      ? SYSTEM_PROMPT +
        "\n\nYour previous output did not match the schema. Return ONLY valid JSON matching the schema exactly, with no extra keys."
      : SYSTEM_PROMPT,
    prompt,
  });
  return result.object;
}

/**
 * Generate a schema-valid verdict model for a product. Throws
 * `VerdictSchemaError` if the model can't produce valid output after one retry.
 * The returned object is the BARE model output (no disclaimers) — the caller
 * attaches guardrail copy.
 */
export async function generateVerdict(product: Product): Promise<VerdictModel> {
  const prompt = buildPrompt(product);

  const first = await callModel(prompt);
  const parsed = verdictModelSchema.safeParse(first);
  if (parsed.success) return parsed.data;

  console.warn("[verdict/ai] first output failed schema, retrying:", parsed.error.issues);
  const second = await callModel(prompt, true);
  const reparsed = verdictModelSchema.safeParse(second);
  if (reparsed.success) return reparsed.data;

  throw new VerdictSchemaError(
    `AI verdict failed schema validation twice: ${reparsed.error.message}`,
  );
}
