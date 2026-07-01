"use client";

/**
 * Premium CTA — black card with an animated turmeric border (background-gradient).
 * Your personal risks "start redacted" (design-system §6): a redaction bar over
 * the value line lifts to reveal what Premium unlocks. No health/medical claims
 * (specs §6) — Nyata flags what to check, it does not diagnose.
 */

import Link from "next/link";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { RedactionBar } from "@/components/nyata/redaction-bar";

export default function PremiumCta() {
  return (
    <section className="mx-auto max-w-md px-1 py-14">
      <BackgroundGradient
        containerClassName="rounded-3xl"
        className="rounded-[calc(1.5rem-4px)] bg-ink p-8"
      >
        <p className="type-eyebrow text-reveal">Nyata Premium · RM9</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-paper">
          Unlock your personal risk profile
        </h2>
        <p className="mt-1 text-sm text-paper/70">
          Buka profil risiko peribadi anda.
        </p>

        <RedactionBar label="TERSEMBUNYI" revealOnMount className="mt-5">
          <p className="type-mono px-4 py-3 text-paper/85">
            Set your conditions — allergy, diabetic, pregnant, buying for a kid —
            and Nyata flags what to check for you specifically.
          </p>
        </RedactionBar>

        <Link
          href="/profile"
          className="mt-6 flex items-center justify-center rounded-xl bg-reveal px-6 py-3.5 font-semibold text-ink transition-transform active:scale-[.98]"
        >
          Go Premium
        </Link>
      </BackgroundGradient>
    </section>
  );
}
