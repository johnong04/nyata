"use client";

/**
 * Landing hero — "The Redacted Label" front door.
 * Bilingual headline (EN over BM) with the reveal words "really / sebenarnya"
 * lit by hero-highlight + framed by pointer-highlight. The subhead sits under a
 * redaction bar that lifts on load — the signature interaction, made literal.
 */

"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { RedactionBar } from "@/components/nyata/redaction-bar";
import { fadeUp } from "@/lib/motion";

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <HeroHighlight
      containerClassName="h-auto min-h-0 -mt-8 bg-paper py-14"
      className="w-full"
    >
      <section className="mx-auto flex max-w-md flex-col items-center gap-6 px-6 text-center">
        <motion.p {...fadeUp(0, reduce)} className="type-eyebrow">
          Digital whistleblower · Pemberi maklumat
        </motion.p>

        <motion.h1
          {...fadeUp(1, reduce)}
          className="type-display flex flex-wrap items-center justify-center gap-x-2 text-ink"
        >
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
        </motion.h1>

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

        <motion.div
          {...fadeUp(2, reduce)}
          className="mt-1 flex w-full max-w-sm flex-col gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/scan"
            className="flex items-center justify-center rounded-xl bg-ink px-6 py-3.5 font-semibold text-paper ring-1 ring-reveal ring-offset-2 ring-offset-paper transition-transform active:scale-[.98]"
          >
            Start Scanning
          </Link>
          <Link
            href="/feed"
            className="flex items-center justify-center rounded-xl border border-ink px-6 py-3.5 font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Browse Feed
          </Link>
        </motion.div>
      </section>
    </HeroHighlight>
  );
}
