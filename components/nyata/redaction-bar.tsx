"use client";

/**
 * RedactionBar — Nyata's signature primitive ("The Redacted Label").
 *
 * A solid ink bar stamped with a mono label (default "TERSEMBUNYI" / hidden).
 * On reveal, the bar WIPES OFF (mask sweep, ~450ms) exposing `children` — the
 * truth underneath — lit by a turmeric --reveal glow. This is Nyata made
 * literal (Nyata = "revealed").
 *
 * Floor: `prefers-reduced-motion` → the bar CROSS-FADES out instead of sweeping.
 * Content is never permanently hidden: children are always in the DOM.
 *
 * Owned by S1. Path is load-bearing (tasks.md PREFLIGHT #2) — do not move.
 * The share renderer (S4) freezes ONE bar mid-lift, so keep this small + reusable.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface RedactionBarProps {
  /** Mono redaction caption painted on the bar. */
  label?: string;
  /** The truth revealed underneath the bar. */
  children: React.ReactNode;
  /** Controlled reveal state. If omitted, the bar reveals once on mount. */
  revealed?: boolean;
  /** Auto-reveal shortly after mount (used when uncontrolled). */
  revealOnMount?: boolean;
  /** Turmeric bloom behind the revealed content. Default on. */
  glow?: boolean;
  className?: string;
}

export function RedactionBar({
  label = "TERSEMBUNYI",
  children,
  revealed,
  revealOnMount = true,
  glow = true,
  className,
}: RedactionBarProps) {
  const reduceMotion = useReducedMotion();
  const controlled = revealed !== undefined;
  const [internal, setInternal] = useState(false);

  useEffect(() => {
    if (controlled || !revealOnMount) return;
    const t = setTimeout(() => setInternal(true), 500);
    return () => clearTimeout(t);
  }, [controlled, revealOnMount]);

  const isRevealed = controlled ? revealed : internal;

  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      {/* Turmeric reveal glow — what's UNDER the bar when it lifts (§2). */}
      {glow && isRevealed && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 50%, var(--color-reveal), transparent 70%)",
            opacity: 0.35,
          }}
        />
      )}

      {/* The truth. Always rendered so content is never blocked. */}
      <div className={cn(!isRevealed && "select-none")} aria-hidden={!isRevealed}>
        {children}
      </div>

      {/* The ink bar. Square corners (§5) — the one hard-edge family. */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            key="redaction"
            className="absolute inset-0 z-10 flex items-center justify-center bg-ink"
            initial={false}
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.3 } }
                : {
                    clipPath: "inset(0 0 0 100%)",
                    transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] },
                  }
            }
          >
            <span className="type-eyebrow text-paper/80 px-4 text-center">
              {label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RedactionBar;
