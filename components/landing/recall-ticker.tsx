"use client";

/**
 * Recall alert ticker — red sticky banner at the top of the landing.
 * LEGAL (design-system §9): official-source only. Each entry links its
 * `official_url`, cites its `source`, uses the neutral factual `title`. An entry
 * with no link is never rendered. No self-authored accusation.
 */

import { StickyBanner } from "@/components/ui/sticky-banner";
import type { LandingRecall } from "@/lib/landing-data";

export default function RecallTicker({
  recalls,
}: {
  recalls: LandingRecall[];
}) {
  const items = recalls.filter((r) => r.official_url);
  if (items.length === 0) return null;

  return (
    <StickyBanner className="bg-elak" hideOnScroll>
      <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-1 px-8 text-paper">
        <span className="type-eyebrow text-paper/90">
          Recall alert · Amaran
        </span>
        {items.map((r) => (
          <a
            key={`${r.source}-${r.date}`}
            href={r.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="type-mono underline decoration-paper/50 underline-offset-2 hover:decoration-paper"
          >
            {r.title} — {r.source}
          </a>
        ))}
      </div>
    </StickyBanner>
  );
}
