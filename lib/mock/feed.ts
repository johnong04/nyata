import type { FeedItem } from "@/lib/types";

/** Community feed fixtures — spans the trio; one recalled item. */
export const MOCK_FEED: FeedItem[] = [
  {
    barcode: "9556003300031",
    name: "Perisa Mi Segera Ayam 75g",
    brand: "Maggi",
    band: "ELAK",
    rating: 8.1,
    flagged_count: 4,
    recalled: true,
    scanned_at: "2026-06-30T14:20:00.000Z",
  },
  {
    barcode: "9556002200023",
    name: "Kordial Oren Pekat 2L",
    brand: "Sunquick",
    band: "WASPADA",
    rating: 5.6,
    flagged_count: 3,
    recalled: false,
    scanned_at: "2026-06-30T11:05:00.000Z",
  },
  {
    barcode: "9556001110015",
    name: "Air Mineral Semula Jadi 600ml",
    brand: "Spritzer",
    band: "SELAMAT",
    rating: 1.2,
    flagged_count: 0,
    recalled: false,
    scanned_at: "2026-06-29T18:40:00.000Z",
  },
];
