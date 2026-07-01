"use client";

/**
 * OcrFailed — the friendly dead-stop when the OCR path can't read a label
 * (no OCR key configured, unreadable photo, or the model returned nothing). The
 * engine already degrades to a stub rather than crashing; this surfaces that as a
 * calm retry, never an error dump. Reuses the redaction idiom (mono classified
 * eyebrow) and offers both retries: scan again, or re-snap the label. Bilingual (§9).
 */
import { Button } from "@/components/ui/button";
import { SnapLabelButton } from "@/components/scan/scan-controls";

export function OcrFailed({
  onRetry,
  onLabelPhoto,
}: {
  onRetry: () => void;
  onLabelPhoto: (file: File) => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-ink px-8 text-center">
      <span className="type-eyebrow mb-4 text-reveal">
        TAK DAPAT BACA · COULDN&apos;T READ
      </span>
      <p className="mb-8 max-w-xs text-paper/80">
        Kami tak dapat baca label itu. Cuba ambil gambar yang lebih jelas dan
        terang.
        <span className="mt-1 block text-sm text-paper/50">
          We couldn&apos;t read that label. Try a clearer, well-lit photo of the
          ingredients.
        </span>
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <SnapLabelButton onLabelPhoto={onLabelPhoto} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onRetry}
          className="h-11 border-paper/25 bg-ink/50 px-5 font-mono text-xs uppercase tracking-widest text-paper hover:bg-ink/70 hover:text-paper"
        >
          Imbas semula · Scan again
        </Button>
      </div>
    </div>
  );
}

export default OcrFailed;
