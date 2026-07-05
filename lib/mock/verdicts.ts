import type { Verdict } from "@/lib/types";

/**
 * Mock verdicts keyed by barcode — spans the full trio (SELAMAT/WASPADA/ELAK)
 * so later screens have variety. Bilingual notes; halal flags say
 * "verify with JAKIM" (design-system §9, legal).
 */
export const MOCK_VERDICTS: Record<string, Verdict> = {
  // SELAMAT — rating 1.2
  "9556001110015": {
    flags: [],
    rating: 1.2,
    summary_bm: "Air mineral tulen tanpa bahan tambahan. Selamat diminum.",
    summary_en: "Plain mineral water with no additives. Safe to drink.",
  },
  // WASPADA — rating 5.6
  "9556002200023": {
    flags: [
      {
        e_number: "E110",
        name: "Sunset Yellow FCF",
        kind: "additive",
        note_bm: "Pewarna sintetik; dikaitkan dengan hiperaktif pada kanak-kanak.",
        note_en: "Synthetic colour; linked to hyperactivity in some children.",
        severity: "med",
      },
      {
        e_number: "E211",
        name: "Sodium Benzoate",
        kind: "additive",
        note_bm: "Bahan pengawet; had penggunaan harian dikawal selia.",
        note_en: "Preservative; regulated daily intake limits apply.",
        severity: "low",
      },
      {
        name: "High added sugar",
        kind: "sugar_sodium",
        note_bm: "Kandungan gula tambahan tinggi setiap hidangan.",
        note_en: "High added-sugar content per serving.",
        severity: "med",
      },
      {
        name: "Peanut traces (shared line)",
        kind: "allergen",
        note_bm: "Mungkin mengandungi kesan kacang tanah dari barisan pengeluaran yang sama.",
        note_en: "May contain peanut traces from a shared production line.",
        severity: "med",
      },
    ],
    rating: 5.6,
    summary_bm:
      "Mengandungi pewarna sintetik dan gula tinggi. Minum secara sederhana.",
    summary_en:
      "Contains synthetic colour and high sugar. Consume in moderation.",
  },
  // ELAK — rating 8.1
  "9556003300031": {
    flags: [
      {
        e_number: "E621",
        name: "Monosodium Glutamate (MSG)",
        kind: "additive",
        note_bm: "Penambah perisa; sesetengah individu sensitif terhadapnya.",
        note_en: "Flavour enhancer; some individuals report sensitivity.",
        severity: "med",
      },
      {
        name: "Gelatine (unspecified source)",
        kind: "halal_doubtful",
        note_bm: "Sumber gelatin tidak dinyatakan — sahkan status halal dengan JAKIM.",
        note_en: "Gelatine source unspecified — verify halal status with JAKIM.",
        severity: "high",
      },
      {
        e_number: "E102",
        name: "Tartrazine",
        kind: "additive",
        note_bm: "Pewarna sintetik; boleh mencetuskan tindak balas pada individu sensitif.",
        note_en: "Synthetic colour; may trigger reactions in sensitive individuals.",
        severity: "med",
      },
      {
        name: "High sodium",
        kind: "sugar_sodium",
        note_bm: "Kandungan natrium tinggi setiap hidangan.",
        note_en: "High sodium content per serving.",
        severity: "high",
      },
    ],
    rating: 8.1,
    summary_bm:
      "Banyak bahan tambahan dan gelatin yang tidak disahkan halal. Sebaiknya elak.",
    summary_en:
      "Many additives and gelatine of unverified halal status. Best avoided.",
  },
};
