import "server-only";
import type { Product } from "@/lib/types";
import { fetchFromOFF } from "./off";
import { ocrLabel } from "./ocr";
import { generateVerdict, MODEL_ID } from "./ai";
import {
  getCachedProduct,
  upsertProduct,
  getCachedVerdict,
  upsertVerdict,
} from "./cache";
import { withDisclaimers } from "./copy";
import { stubVerdict } from "./stub";
import { enrichFlagsWithJurisdiction } from "@/lib/hazards/enrich";
import { getHazards } from "@/lib/hazards/store";
import type { VerdictWithCopy } from "./types";

/**
 * lib/verdict — server-only entry points backing the `getProductByBarcode` /
 * `getVerdict` seams. Internals (OFF, OCR, AI, cache, copy) stay private. The
 * whole tree is server-only (AI + service keys). Every path degrades to a stub
 * rather than throwing.
 */

export type { VerdictWithCopy } from "./types";

/**
 * Resolve a product by barcode: cached row → OpenFoodFacts → null. On an OFF
 * hit the product is cached best-effort. Never throws.
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const cached = await getCachedProduct(barcode);
  if (cached) return cached;

  const off = await fetchFromOFF(barcode);
  if (off) {
    await upsertProduct(off);
    return off;
  }
  return null;
}

/**
 * Full verdict for a barcode (with optional label photo for the OCR fallback).
 *
 * Flow: resolve product (cache → OFF → OCR) → verdict cache hit returns without
 * an AI call (the caching guardrail) → else generate + validate + persist. Any
 * failure returns a stub verdict; no error escapes. Stubs are never cached.
 */
export async function getVerdict(input: {
  barcode: string;
  labelPhoto?: string; // back of pack — ingredients (may also carry the name)
  frontPhoto?: string; // front of pack — name + brand
}): Promise<VerdictWithCopy> {
  const { barcode, labelPhoto, frontPhoto } = input;

  // 1. Resolve the product (cache → OFF → OCR the photo(s)).
  let product = await getProductByBarcode(barcode);
  if (!product && (labelPhoto || frontPhoto)) {
    const back = labelPhoto ? await ocrLabel(labelPhoto) : null;
    const front = frontPhoto ? await ocrLabel(frontPhoto) : null;
    // Front wins for name/brand (that's its job); back wins for ingredients.
    const name = front?.name || back?.name || "";
    const brand = front?.brand || back?.brand || "";
    const ingredients = back?.ingredients || front?.ingredients || "";
    // A name OR ingredients is enough to anchor the product under this barcode —
    // the barcode is the identity even when OFF had nothing (§11.4).
    if (name || ingredients) {
      product = {
        barcode,
        name,
        brand,
        ingredients_raw: ingredients,
        source: "ocr",
        cached_at: new Date().toISOString(),
      };
      await upsertProduct(product);
    }
  }
  if (!product) return stubVerdict("no-product");

  // 2. Verdict cache hit → return without calling the AI (caching guardrail).
  const cachedVerdict = await getCachedVerdict(barcode);
  if (cachedVerdict) return cachedVerdict;

  // 3. No key → honest stub, do not cache.
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return stubVerdict("no-key");

  // 4. Generate + validate. On any failure, stub (never persist an invalid one).
  try {
    const model = await generateVerdict(product);
    // Attach verified B1 citations to matching flags (never changes rating).
    const enriched = {
      ...model,
      flags: enrichFlagsWithJurisdiction(model.flags, getHazards()),
    };
    await upsertVerdict(barcode, enriched, MODEL_ID);
    return withDisclaimers(enriched);
  } catch (err) {
    console.warn("[verdict] generation failed, returning stub:", err);
    return stubVerdict("ai-failed");
  }
}
