/**
 * Landing recalls adapter. Keeps the `lib/api.ts` seam clean: the ticker and the
 * Latest Recalls list both read from this single source.
 *
 * LEGAL (design-system §9): official-source only. Every entry carries an
 * `official_url`; anything without one is dropped. Nothing is fabricated — this
 * only republishes what the recalls mock (later, the real backend) actually has.
 */

import { getFeed, getProductByBarcode, getRecallsForProduct } from "@/lib/api";
import type { Recall } from "@/lib/types";

/** A recall plus the product it was listed against (for display context). */
export interface LandingRecall extends Recall {
  product: string;
  brand: string;
}

/** Newest-first, official-source only, capped at 5. */
export async function getLandingRecalls(): Promise<LandingRecall[]> {
  const recalled = await getFeed("recalled");

  const collected: LandingRecall[] = [];
  for (const item of recalled) {
    const product = await getProductByBarcode(item.barcode);
    if (!product) continue;
    const recalls = await getRecallsForProduct(product);
    for (const r of recalls) {
      if (!r.official_url) continue; // legal §6: never surface an unlinkable recall
      collected.push({ ...r, product: item.name, brand: item.brand });
    }
  }

  return collected
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}
