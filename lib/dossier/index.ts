import "server-only";
import type { Dossier } from "@/lib/types";
import { normalize } from "@/lib/recalls/normalize";
import { getCachedDossier, upsertDossier } from "./cache";
import { fetchDossier } from "./gemini";

const MODEL_ID = "gemini-2.5-flash";

function brandKey(input: { brand: string; name: string }): string {
  return normalize(input.brand) || normalize(input.name);
}

/** Cache-only read (NO spend) — used by the product page + share card badge. */
export async function getDossierCached(input: {
  brand: string;
  name: string;
}): Promise<Dossier | null> {
  const key = brandKey(input);
  if (!key) return null;
  return getCachedDossier(key);
}

/**
 * On-demand "dig deeper": cache hit → return; else one grounded Gemini call →
 * cache → return. Null (honest empty) when nothing survives the gate / no key.
 * Never throws. Caches only NON-empty dossiers (never a null).
 */
export async function getDossier(input: {
  brand: string;
  name: string;
  barcode?: string;
}): Promise<Dossier | null> {
  const key = brandKey(input);
  if (!key) return null;

  const cached = await getCachedDossier(key);
  if (cached) return cached;

  const fresh = await fetchDossier({ brand: input.brand, name: input.name });
  if (!fresh) return null;

  await upsertDossier(fresh, { productBarcode: input.barcode, model: MODEL_ID });
  return fresh;
}
