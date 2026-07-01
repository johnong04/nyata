"use client";

/**
 * Analyzing — the "un-redaction" moment (design-system §6/§7). A full-stage ink
 * scrim over the frozen camera, a forensic multi-step sequence (reading label →
 * cross-referencing MOH → checking additives), and a streaming AI cross-ref line
 * rendered with Aceternity's text-generate-effect.
 *
 * The shipped multi-step-loader ships black/lime colors we can't recolor without
 * forking it, so the step column here is a token-native rendering of the same
 * pattern (mono step text, turmeric --reveal active tick), while the AI line uses
 * the registry text-generate-effect verbatim (§6 mapping).
 *
 * Legal (specs §6): copy is PROCESS NARRATION only — never a product/brand claim.
 * Never blocks the route transition; reduced-motion collapses to an instant advance.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

const STEPS = [
  { bm: "Membaca label", en: "Reading label" },
  { bm: "Rujuk silang MOH", en: "Cross-referencing MOH" },
  { bm: "Semak bahan tambahan", en: "Checking additives" },
] as const;

const STEP_MS = 750; // ~2.2s total across 3 steps

export function Analyzing({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    // Reduced motion: advance instantly, fire onComplete on the next tick.
    if (reduceMotion) {
      setStep(STEPS.length - 1);
      const t = setTimeout(() => {
        if (!done.current) {
          done.current = true;
          onComplete();
        }
      }, 150);
      return () => clearTimeout(t);
    }
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * STEP_MS)
    );
    const finish = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        onComplete();
      }
    }, STEPS.length * STEP_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
  }, [reduceMotion, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink/95 px-8"
    >
      <span className="type-eyebrow mb-8 text-reveal">
        MENGANALISIS · ANALYZING
      </span>

      {/* Forensic step column — token-native. */}
      <ul className="flex w-full max-w-xs flex-col gap-4">
        {STEPS.map((s, i) => {
          const state = i < step ? "done" : i === step ? "active" : "pending";
          return (
            <li key={s.en} className="flex items-start gap-3">
              <Tick state={state} />
              <div className="flex flex-col">
                <span
                  className={`font-mono text-sm ${
                    state === "pending" ? "text-paper/40" : "text-paper"
                  }`}
                >
                  {s.bm}
                </span>
                <span
                  className={`font-mono text-xs ${
                    state === "pending" ? "text-paper/25" : "text-paper/55"
                  }`}
                >
                  {s.en}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Streaming AI cross-ref line — process narration, not a claim (§6). */}
      <AnimatePresence>
        {step >= STEPS.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 max-w-xs text-center"
          >
            <TextGenerateEffect
              words="Mengesan bahan tambahan tersembunyi…"
              filter={!reduceMotion}
              duration={reduceMotion ? 0 : 0.4}
              className="text-center text-base font-normal text-reveal"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Tick({ state }: { state: "done" | "active" | "pending" }) {
  const color =
    state === "pending" ? "var(--color-paper)" : "var(--color-reveal)";
  const opacity = state === "pending" ? 0.35 : 1;
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-5 w-5 shrink-0"
      style={{ color, opacity }}
      fill={state === "done" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      {state === "done" ? (
        <path
          fillRule="evenodd"
          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
          clipRule="evenodd"
        />
      ) : (
        <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      )}
    </svg>
  );
}

export default Analyzing;
