"use client";

/**
 * Reticle — the bespoke camera viewfinder (design-system §Build rule: the camera
 * reticle is hand-built, not an Aceternity component).
 *
 * A centered square target with four turmeric L-brackets (square corners — §5:
 * documents are ruled, not rounded), a dimmed ink scrim outside it so the target
 * pops, and a SELAMAT-green scan-line sweeping top↔bottom. The green stays inside
 * the token palette (--color-selamat, the SAFE state) rather than a raw green.
 *
 * `prefers-reduced-motion` holds the scan-line static (§7 floor).
 */
import { motion, useReducedMotion } from "motion/react";

export function Reticle() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
      {/* Mono eyebrow above the target (§3/§4). */}
      <span className="type-eyebrow mb-6 text-reveal">IMBAS · SCAN</span>

      {/* The square target. The scrim is drawn as a huge box-shadow spill so the
          hole stays perfectly crisp regardless of viewport. */}
      <div
        className="relative aspect-square w-[68vw] max-w-[300px]"
        style={{ boxShadow: "0 0 0 100vmax rgba(23,20,15,0.62)" }}
      >
        {/* Four L-brackets — square corners, turmeric reveal ink. */}
        <Bracket className="left-0 top-0 border-l-2 border-t-2" />
        <Bracket className="right-0 top-0 border-r-2 border-t-2" />
        <Bracket className="bottom-0 left-0 border-b-2 border-l-2" />
        <Bracket className="bottom-0 right-0 border-b-2 border-r-2" />

        {/* Green scan-line sweeping inside the target. */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-[2px]"
            style={{
              background: "var(--color-selamat)",
              boxShadow: "0 0 12px 1px var(--color-selamat)",
              top: reduceMotion ? "50%" : 0,
            }}
            animate={reduceMotion ? undefined : { top: ["4%", "96%"] }}
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 1.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear",
                  }
            }
          />
        </div>
      </div>

      {/* Instruction line under the target. */}
      <p className="type-mono mt-6 max-w-[70vw] text-center text-paper/70">
        Halakan ke barkod · Point at the barcode
      </p>
    </div>
  );
}

function Bracket({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute h-7 w-7 border-reveal ${className ?? ""}`}
    />
  );
}

export default Reticle;
