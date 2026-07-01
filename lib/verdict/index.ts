import "server-only";
import type { Product } from "@/lib/types";
import { fetchFromOFF } from "./off";
import { ocrIngredients } from "./ocr";
import { generateVerdict, MODEL_ID } from "./ai";
import {
  getCachedProduct,
  upsertProduct,
  getCachedVerdict,
  upsertVerdict,
} from "./cache";
import { withDisclaimers } from "./copy";
import { stubVerdict } from "./stub";
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
  labelPhoto?: string;
}): Promise<VerdictWithCopy> {
  const { barcode, labelPhoto } = input;

  // 1. Resolve the product (cache → OFF → OCR fallback on a label photo).
  let product = await getProductByBarcode(barcode);
  if (!product && labelPhoto) {
    const ingredients = await ocrIngredients(labelPhoto);
    if (ingredients) {
      product = {
        barcode,
        name: "",
        brand: "",
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
    await upsertVerdict(barcode, model, MODEL_ID);
    return withDisclaimers(model);
  } catch (err) {
    console.warn("[verdict] generation failed, returning stub:", err);
    return stubVerdict("ai-failed");
  }
}
