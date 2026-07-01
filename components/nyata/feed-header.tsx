"use client";

/**
 * FeedHeader — the attention hook (design-system §4 eyebrow + §6 social proof).
 * Community-alerts eyebrow → "Hidden Ingredients" display title → a social-proof
 * row: @aceternity/animated-tooltip avatar stack (recoloured to ink borders) +
 * the hand-rolled count-up ("12k scanned today"). Numbers are illustrative mock
 * for the front-door (OPEN item accepted); real counts wire to `scans` later.
 */
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { CountUp } from "@/components/nyata/count-up";

/** Inline SVG avatars — no network dependency (renders in the offline sanity shot). */
function avatar(initials: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="112" height="112" viewBox="0 0 112 112"><rect width="112" height="112" fill="${bg}"/><text x="56" y="66" font-family="monospace" font-size="40" font-weight="700" fill="#FAF9F6" text-anchor="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SCANNERS = [
  { id: 1, name: "Aina", designation: "Johor Bahru", image: avatar("AN", "#17140F") },
  { id: 2, name: "Wei Jie", designation: "Kuala Lumpur", image: avatar("WJ", "#4A453D") },
  { id: 3, name: "Suria", designation: "Penang", image: avatar("SR", "#1E874B") },
  { id: 4, name: "Danish", designation: "Ipoh", image: avatar("DN", "#E08A00") },
  { id: 5, name: "Mei Ling", designation: "Melaka", image: avatar("ML", "#D33118") },
];

export function FeedHeader() {
  return (
    <header className="relative mb-6">
      {/* Faint document texture under the header — restraint (§5). */}
      <div className="bg-document pointer-events-none absolute inset-0 -z-10 opacity-40" />

      <p className="type-eyebrow">Community Alerts · Amaran Komuniti</p>
      <h1 className="type-display mt-2 text-ink">
        Hidden
        <br />
        Ingredients
      </h1>
      <p className="mt-1 font-display text-xl font-bold text-ink-40">
        Ramuan Tersembunyi
      </p>

      {/* Social proof: avatar stack + count-up. */}
      <div className="mt-5 flex items-center gap-4">
        <div className="flex items-center">
          <AnimatedTooltip items={SCANNERS} />
        </div>
        <p className="font-mono text-sm text-ink-70">
          <span className="font-bold text-ink">
            <CountUp to={12480} />
          </span>{" "}
          scanned today
          <br />
          <span className="text-ink-40">diimbas hari ini</span>
        </p>
      </div>
    </header>
  );
}

export default FeedHeader;
