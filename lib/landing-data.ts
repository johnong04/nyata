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

  // Fan out across recalled items concurrently — the previous sequential loop
  // did N × (product lookup + recall query) live round-trips in series, which
  // is the ~3s feed→home stall. Promise.all bounds it to ~one round-trip deep.
  const perItem = await Promise.all(
    recalled.map(async (item): Promise<LandingRecall[]> => {
      const product = await getProductByBarcode(item.barcode);
      if (!product) return [];
      const recalls = await getRecallsForProduct(product);
      return recalls
        .filter((r) => Boolean(r.official_url)) // legal §6: never surface an unlinkable recall
        .map((r) => ({ ...r, product: item.name, brand: item.brand }));
    }),
  );

  return perItem
    .flat()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}
