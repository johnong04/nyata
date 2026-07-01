"use client";

/**
 * The Nyata Method — three steps in real sequence (Imbas → Hurai → Putus).
 * Numbering encodes a true order (the scan flow), so the 01/02/03 markers earn
 * their place. Built on card-hover-effect, recolored to ink/paper tokens.
 */

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const STEPS = [
  {
    n: "01",
    title: "Imbas",
    en: "Scan",
    desc: "Point your camera at any Malaysian product — barcode or ingredient label.",
  },
  {
    n: "02",
    title: "Hurai",
    en: "Decode",
    desc: "Nyata cross-references additives, halal doubt, and official recall records.",
  },
  {
    n: "03",
    title: "Putus",
    en: "Decide",
    desc: "Read the verdict — SELAMAT, WASPADA, or ELAK — and post it in two seconds.",
  },
];

export default function NyataMethod() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="mx-auto max-w-md px-1 py-14">
      <p className="type-eyebrow text-center">Kaedah Nyata · The method</p>
      <h2 className="mt-2 text-center font-display text-3xl font-bold text-ink">
        Three steps to the truth
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-3">
        {STEPS.map((s, idx) => (
          <div
            key={s.n}
            className="relative block"
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            <AnimatePresence>
              {hovered === idx && (
                <motion.span
                  className="absolute inset-0 block rounded-2xl bg-surface-2"
                  layoutId="methodHover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.15 } }}
                  exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                />
              )}
            </AnimatePresence>
            <div
              className={cn(
                "relative z-10 flex items-start gap-4 rounded-2xl border border-line bg-card p-5",
              )}
            >
              <span className="type-mono shrink-0 text-2xl font-bold text-reveal">
                {s.n}
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-ink">
                  {s.title}{" "}
                  <span className="text-base font-medium text-ink-40">
                    / {s.en}
                  </span>
                </h3>
                <p className="mt-1 text-sm text-ink-70">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
