"use client";

/**
 * CountUp — hand-rolled number ticker (PREFLIGHT: @aceternity/stats-with-number-
 * ticker is Pro-gated / 401, so we roll our own in a few lines with `motion`).
 * Animates 0 → `to` on mount, snaps instantly under prefers-reduced-motion
 * (design-system §7 floor). Mono, since it's document data.
 */
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

export function CountUp({
  to,
  suffix = "",
  durationMs = 1400,
}: {
  to: number;
  suffix?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

export default CountUp;
