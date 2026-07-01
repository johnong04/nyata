"use client";

/**
 * VerdictDetail — the hero composition (design-system §6/§8). Orchestrates the
 * signature un-redaction: hazards start under an ink RedactionBar and wipe to
 * reveal on mount (~450ms), the truth lit by a turmeric --reveal bloom. Layout:
 * classified header → stamp inside a turmeric background-gradient + on-screen
 * 3d-card tilt → streamed forensic summary → un-redacted hazard breakdown →
 * official recall → redacted premium upsell → share CTA. The 3d tilt is
 * on-screen only and never baked into the flat share export (that's S4).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product, Verdict, Recall } from "@/lib/types";
import { RedactionBar } from "@/components/nyata/redaction-bar";
import { VerdictStamp } from "@/components/nyata/verdict-stamp";
import { HazardPanel } from "@/components/nyata/hazard-panel";
import { RecallBlock } from "@/components/nyata/recall-block";
import { PremiumUpsell } from "@/components/nyata/premium-upsell";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VerdictDetail({
  product,
  verdict,
  recalls,
}: {
  product: Product;
  verdict: Verdict;
  recalls: Recall[];
}) {
  // The un-redaction: bar covers hazards, wipes on mount (~450ms). The
  // RedactionBar primitive owns the reduced-motion floor (cross-fade), but we
  // still short-circuit the timer so reduced-motion reveals instantly.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setRevealed(true), 450);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="bg-document mx-auto flex max-w-md flex-col gap-6 bg-paper p-4">
      {/* Classified file header — the dossier being declassified. */}
      <header className="rounded-none bg-ink px-4 py-3 text-paper">
        <span className="font-mono text-[0.8125rem] uppercase tracking-[0.16em] text-paper/60">
          CLASSIFIED · TERSEMBUNYI
        </span>
        <h1 className="font-display text-xl font-bold leading-tight">{product.name}</h1>
        <span className="font-mono text-xs text-paper/60">
          {product.brand} · {product.barcode}
        </span>
      </header>

      {/* Stamp inside the turmeric reveal glow + on-screen 3d tilt. */}
      <BackgroundGradient className="rounded-2xl" containerClassName="rounded-2xl">
        <CardContainer className="w-full py-0" containerClassName="py-0">
          <CardBody className="h-auto w-full rounded-2xl bg-card p-6">
            <CardItem translateZ={40} className="w-full">
              <VerdictStamp rating={verdict.rating} />
            </CardItem>
          </CardBody>
        </CardContainer>
      </BackgroundGradient>

      {/* Forensic summary, streamed in the whistleblower voice. */}
      <section aria-label="Summary" className="text-ink">
        <h2 className="type-eyebrow mb-1">RUMUSAN · SUMMARY</h2>
        <TextGenerateEffect words={verdict.summary_en} className="font-normal" />
        <p className="mt-2 text-ink-70">{verdict.summary_bm}</p>
      </section>

      {/* THE UN-REDACTION — hazards start under the bar, wipe to reveal. */}
      <RedactionBar revealed={revealed} label="TERSEMBUNYI">
        <HazardPanel flags={verdict.flags} />
      </RedactionBar>

      {/* Official recall — renders nothing when there are none. */}
      <RecallBlock recalls={recalls} />

      {/* Premium upsell — risks stay redacted. */}
      <PremiumUpsell />

      {/* Share → S4 flat share export flow. */}
      <Link
        href={`/share/${product.barcode}`}
        className={cn(
          buttonVariants(),
          "h-11 w-full rounded-xl bg-ink text-paper hover:bg-ink/90"
        )}
      >
        Kongsi · Share verdict →
      </Link>
    </main>
  );
}
