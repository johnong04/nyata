import "server-only";
import type { Product } from "@/lib/types";
import { fetchFromOFF } from "./off";
import { getCachedProduct, upsertProduct } from "./cache";

/**
 * lib/verdict — server-only entry points backing the `getProductByBarcode` /
 * `getVerdict` seams. Internals (OFF client, OCR, AI call, cache, copy) stay
 * private to this directory. The whole tree is server-only (AI/service keys).
 *
 * Chunk 1: product resolution (cache → OFF). getVerdict lands in Chunk 3.
 */

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
