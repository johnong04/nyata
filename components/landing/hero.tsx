"use client";

/**
 * Landing hero — "The Redacted Label" front door.
 * Bilingual headline (EN over BM) with the reveal words "really / sebenarnya"
 * lit by hero-highlight + framed by pointer-highlight. The subhead sits under a
 * redaction bar that lifts on load — the signature interaction, made literal.
 */

import Link from "next/link";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { RedactionBar } from "@/components/nyata/redaction-bar";

export default function Hero() {
  return (
    <HeroHighlight
      containerClassName="h-auto min-h-0 -mx-5 -mt-8 bg-paper py-14"
      className="w-full"
    >
      <section className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 text-center">
        <p className="type-eyebrow">
          Digital whistleblower · Pemberi maklumat
        </p>

        <h1 className="type-display flex flex-wrap items-center justify-center gap-x-2 text-ink">
          <span>What are you</span>
          <PointerHighlight
            containerClassName="inline-flex"
            rectangleClassName="border-ink"
            pointerClassName="text-reveal"
          >
            <Highlight className="rounded-none bg-[linear-gradient(to_right,var(--color-reveal),var(--color-reveal))] px-1 text-ink">
              really
            </Highlight>
          </PointerHighlight>
          <span>eating?</span>
          <span className="mt-3 block text-[0.62em] font-bold text-ink-70">
            Apa yang anda{" "}
            <Highlight className="rounded-none bg-[linear-gradient(to_right,var(--color-reveal),var(--color-reveal))] px-1 text-ink">
              sebenarnya
            </Highlight>{" "}
            makan?
          </span>
        </h1>

        <RedactionBar
          label="TERSEMBUNYI"
          revealOnMount
          className="w-full max-w-sm"
        >
          <p className="type-mono px-4 py-3 text-ink-70">
            Scan a Malaysian product. Get the verdict on additives, halal doubt,
            and official recalls.
          </p>
        </RedactionBar>

        <div className="mt-1 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/scan"
            className="flex items-center justify-center rounded-xl bg-ink px-6 py-3.5 font-semibold text-paper transition-transform active:scale-[.98]"
          >
            Start Scanning
          </Link>
          <Link
            href="/feed"
            className="flex items-center justify-center rounded-xl border border-ink px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Browse Feed
          </Link>
        </div>
      </section>
    </HeroHighlight>
  );
}
