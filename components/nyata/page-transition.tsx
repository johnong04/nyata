"use client";

/**
 * PageTransition — a lightweight route-entrance (fade-up) so navigating between
 * app tabs feels intentional instead of snapping. Keyed on the pathname: each
 * route remounts and fades in. Deliberately NO exit animation / AnimatePresence
 * — content is never held behind motion, which guards against reintroducing the
 * S1 ~3s page-transition perf issue. Transform/opacity only, <300ms (DUR.base).
 * Reduced-motion → no transition (renders instantly). §7 floor.
 */
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { DUR, EASE } from "@/lib/motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.base, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
