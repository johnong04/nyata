"use client";

/**
 * ScanGuide — the adaptive hologram capture overlay (§11.4). Barcode detection
 * uses the live video (Reticle); this owns the OCR-photo phases. It tells the
 * user which surface to point at, then takes the photo via a native camera-capture
 * input (sharp, autofocus) or a gallery upload. The live video is NEVER OCR'd.
 *
 * Legal (specs §6): copy is instructional only — never a product/brand claim.
 */
import { motion, useReducedMotion } from "motion/react";
import { SnapLabelButton, GalleryButton } from "@/components/scan/scan-controls";

const COPY = {
  back: {
    eyebrow: "LANGKAH 1 · STEP 1",
    title: "Imbas senarai bahan · Snap the ingredients",
    sub: "Belakang produk · Back of the pack",
  },
  front: {
    eyebrow: "LANGKAH 2 · STEP 2",
    title: "Imbas depan produk · Snap the front",
    sub: "Nama & jenama, untuk recall & berita · Name & brand, for recalls & news",
  },
} as const;

export function ScanGuide({
  phase,
  onPhoto,
  onSkip,
}: {
  phase: "back" | "front";
  onPhoto: (file: File) => void;
  onSkip?: () => void;
}) {
  const reduce = useReducedMotion();
  const copy = COPY[phase];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/80 px-8 text-center">
      <span className="type-eyebrow mb-5 text-reveal">{copy.eyebrow}</span>

      {/* Square holographic frame — reveal L-brackets + a constant scan sweep. */}
      <motion.div
        key={phase}
        initial={reduce ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
        className="relative aspect-[4/3] w-[70vw] max-w-[320px] overflow-hidden"
        style={{ willChange: "transform" }}
      >
        <Bracket className="left-0 top-0 border-l-2 border-t-2" />
        <Bracket className="right-0 top-0 border-r-2 border-t-2" />
        <Bracket className="bottom-0 left-0 border-b-2 border-l-2" />
        <Bracket className="bottom-0 right-0 border-b-2 border-r-2" />
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-16"
            style={{
              background:
                "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-reveal) 28%, transparent), transparent)",
              willChange: "transform",
            }}
            initial={{ y: "-100%" }}
            animate={{ y: "400%" }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </motion.div>

      <p className="mt-6 max-w-xs font-[var(--font-display)] text-lg text-paper">
        {copy.title}
      </p>
      <p className="mt-1 max-w-xs font-mono text-xs uppercase tracking-widest text-paper/55">
        {copy.sub}
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <SnapLabelButton onPhoto={onPhoto} className="w-full" />
        <GalleryButton onPhoto={onPhoto} className="w-full" />
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-1 font-mono text-xs uppercase tracking-widest text-paper/45 hover:text-paper/70"
          >
            Langkau · Skip
          </button>
        )}
      </div>
    </div>
  );
}

function Bracket({ className }: { className?: string }) {
  return <span aria-hidden className={`absolute h-7 w-7 border-reveal ${className ?? ""}`} />;
}

export default ScanGuide;
