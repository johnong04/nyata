import type { Recall } from "@/lib/types";

/**
 * Mock recalls keyed by barcode. LEGAL (design-system §9, tasks.md #8):
 * every recall reads as an official-source citation — source + title +
 * official_url + date, neutral factual language. No self-authored brand or
 * health accusations, even in fixtures. This is the safe pattern the real
 * data (S11) must follow.
 */
export const MOCK_RECALLS: Record<string, Recall[]> = {
  "9556003300031": [
    {
      source: "MOH Malaysia (KKM)",
      title:
        "Product listed in Ministry of Health food safety alert — undeclared allergen",
      official_url: "https://www.moh.gov.my/index.php/pages/view/food-safety",
      date: "2026-05-14",
      severity: "high",
    },
  ],
};

export const NO_RECALLS: Recall[] = [];

/**
 * Community-feed recalls (S6). Standalone official-source citations shown in the
 * "Recalled" filter — each MUST carry a live official_url to an official landing
 * page (MOH / NPRA). Neutral factual titles only; no self-authored brand claim.
 * getFeedRecalls() fails closed on any entry missing official_url.
 */
export const MOCK_FEED_RECALLS: Recall[] = [
  {
    source: "MOH Malaysia (KKM)",
    title:
      "Product listed in Ministry of Health food safety alert — undeclared allergen",
    official_url: "https://www.moh.gov.my/index.php/pages/view/food-safety",
    date: "2026-05-14",
    severity: "high",
  },
  {
    source: "NPRA Malaysia",
    title:
      "Batch listed in National Pharmaceutical Regulatory Agency safety recall — unregistered substance",
    official_url: "https://npra.gov.my/index.php/en/consumers/safety-alerts.html",
    date: "2026-06-02",
    severity: "high",
  },
];
