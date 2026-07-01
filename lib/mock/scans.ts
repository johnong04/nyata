import type { Scan } from "@/lib/types";

/** Local scan history fixtures for the History screen. */
export const MOCK_SCANS: Scan[] = [
  {
    barcode: "9556003300031",
    name: "Perisa Mi Segera Ayam 75g",
    band: "ELAK",
    rating: 8.1,
    scanned_at: "2026-06-30T14:20:00.000Z",
  },
  {
    barcode: "9556002200023",
    name: "Kordial Oren Pekat 2L",
    band: "WASPADA",
    rating: 5.6,
    scanned_at: "2026-06-30T11:05:00.000Z",
  },
  {
    barcode: "9556001110015",
    name: "Air Mineral Semula Jadi 600ml",
    band: "SELAMAT",
    rating: 1.2,
    scanned_at: "2026-06-29T18:40:00.000Z",
  },
];
