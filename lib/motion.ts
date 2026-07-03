// lib/motion.ts
// Shared motion vocabulary (design-system §7 + /web-animation-design).
// Durations in seconds (motion/react convention). Transform+opacity only.
// prefers-reduced-motion is handled at call sites via useReducedMotion().

export const DUR = {
  micro: 0.15, // hover / press / tap feedback
  base: 0.24, // standard entrance/exit (<300ms rule)
  reveal: 0.45, // the ONE signature un-redaction (redaction bar)
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1], // entrances — decelerate in
  in: [0.7, 0, 0.84, 0], // exits — accelerate out
  inOut: [0.65, 0, 0.35, 1], // moves / shared-layout — matches RedactionBar wipe
} as const;

export const STAGGER = 0.04; // feed fade-up cadence (§7: 40ms)

// Canonical fade-up for lists/sections. Spread onto a motion element;
// pass reduce (from useReducedMotion()) to collapse to no-op.
export function fadeUp(index = 0, reduce?: boolean | null) {
  if (reduce) return { initial: false as const };
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.base, delay: index * STAGGER, ease: EASE.out },
  };
}
