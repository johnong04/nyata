import type { Product } from "@/lib/types";

/**
 * Realistic Malaysian sample products, keyed by barcode.
 * Barcodes are illustrative fixtures for the demo, not scraped live data.
 */
export const MOCK_PRODUCTS: Record<string, Product> = {
  // SELAMAT sample — plain, minimal additives
  "9556001110015": {
    barcode: "9556001110015",
    name: "Air Mineral Semula Jadi 600ml",
    brand: "Spritzer",
    ingredients_raw: "Natural mineral water.",
    source: "off",
    cached_at: "2026-06-28T09:00:00.000Z",
  },
  // WASPADA sample — sweetened, some additives
  "9556002200023": {
    barcode: "9556002200023",
    name: "Kordial Oren Pekat 2L",
    brand: "Sunquick",
    ingredients_raw:
      "Water, sugar, orange juice concentrate (25%), citric acid (E330), stabiliser (E466), preservative (E211), colour (E110).",
    source: "off",
    cached_at: "2026-06-28T09:05:00.000Z",
  },
  // ELAK sample — heavily processed, halal-doubtful ingredient
  "9556003300031": {
    barcode: "9556003300031",
    name: "Perisa Mi Segera Ayam 75g",
    brand: "Maggi",
    ingredients_raw:
      "Wheat flour, palm oil, salt, flavour enhancer (E621), gelatine, hydrolysed vegetable protein, colour (E102), anticaking agent (E551).",
    source: "off",
    cached_at: "2026-06-28T09:10:00.000Z",
  },
};
