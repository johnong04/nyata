import "server-only";
import type { Product } from "@/lib/types";

/**
 * OpenFoodFacts REST v2 lookup by barcode. Public, no key. Fails soft: any
 * miss / non-200 / timeout / thrown error returns null (never throws) so the
 * orchestrator can fall through to OCR or a stub. OFF policy requires an
 * identifying User-Agent.
 */
const OFF_BASE = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "product_name,brands,ingredients_text";
const UA = "Nyata/0.1 (nyata.app)";

interface OffResponse {
  status?: number; // 1 = found, 0 = not found
  product?: {
    product_name?: string;
    brands?: string;
    ingredients_text?: string;
  };
}

export async function fetchFromOFF(barcode: string): Promise<Product | null> {
  const url = `${OFF_BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json()) as OffResponse;
    if (body.status !== 1 || !body.product) return null;

    const p = body.product;
    const name = p.product_name?.trim() || null;
    const ingredients = p.ingredients_text?.trim() || null;
    // A product with neither a name nor ingredients is useless to us.
    if (!name && !ingredients) return null;

    return {
      barcode,
      name: name ?? "",
      brand: p.brands?.trim() || "",
      ingredients_raw: ingredients ?? "",
      source: "off",
      cached_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[verdict/off] lookup failed for ${barcode}:`, err);
    return null;
  }
}
