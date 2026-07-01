"use client";

/**
 * Interactive RedactionBar demo for the shell sanity check. A tap toggles the
 * reveal so the signature interaction is visible/screenshottable. Dev-simple —
 * later slices use RedactionBar in real verdict contexts.
 */

import { useState } from "react";
import { RedactionBar } from "@/components/nyata/redaction-bar";
import { bandForRating, glossForBand } from "@/lib/types";

export function RedactionDemo() {
  const [revealed, setRevealed] = useState(false);
  const rating = 8.1;
  const band = bandForRating(rating);

  return (
    <section className="mt-8">
      <p className="type-eyebrow">Classified · Tersembunyi</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-ink">
        The un-redaction
      </h2>
      <p className="mt-2 text-sm text-ink-70">
        Tap the bar to reveal the verdict underneath.
      </p>

      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        className="mt-4 block w-full text-left"
        aria-pressed={revealed}
      >
        <RedactionBar revealed={revealed} revealOnMount={false}>
          <div className="rounded-2xl border border-line bg-card p-6">
            <p className="type-eyebrow">Verdict · Putusan</p>
            <p className="type-verdict mt-1 text-elak">{band}</p>
            <p className="type-mono mt-1 text-ink-70">
              {rating.toFixed(1)} / 10 · {glossForBand(band)}
            </p>
          </div>
        </RedactionBar>
      </button>

      <p className="type-mono mt-3 text-ink-40">
        {revealed ? "// revealed — tap to re-redact" : "// tap to un-redact"}
      </p>
    </section>
  );
}

export default RedactionDemo;
