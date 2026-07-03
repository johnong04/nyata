"use client";

/**
 * ScanControls — the bottom control bar over the camera stage.
 *
 * Manual entry (the always-works demo spine) and a feature-detected flashlight
 * toggle. Manual entry funnels through the SAME `onBarcode` as auto-detect (T6),
 * so both paths hit one code path. All copy is bilingual (§9).
 */
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * SnapLabelButton — the OCR fallback trigger. A label-wrapped file input
 * (`capture="environment"` opens the rear camera on mobile, falls back to the
 * gallery/file picker elsewhere) so a product not in OpenFoodFacts can still be
 * read off its printed ingredient list. Styled to match the mono control chrome.
 */
export function SnapLabelButton({
  onPhoto,
  className = "",
}: {
  onPhoto: (file: File) => void;
  className?: string;
}) {
  return (
    <label
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-paper/25 bg-ink/50 px-5 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-ink/70 ${className}`}
    >
      <LabelIcon />
      Imbas label · Snap the label
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Snap the product label"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so re-picking the same file still fires onChange.
          e.target.value = "";
          if (file) onPhoto(file);
        }}
      />
    </label>
  );
}

/**
 * GalleryButton — the gallery twin of SnapLabelButton. Same file input but NO
 * `capture` attribute, so it opens the photo library instead of the camera.
 */
export function GalleryButton({
  onPhoto,
  className = "",
}: {
  onPhoto: (file: File) => void;
  className?: string;
}) {
  return (
    <label
      className={`inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-paper/25 bg-ink/50 px-5 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-ink/70 ${className}`}
    >
      <GalleryIcon />
      Muat naik · Upload photo
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Upload a product photo from your library"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // re-pick same file still fires onChange
          if (file) onPhoto(file);
        }}
      />
    </label>
  );
}

function GalleryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

export function ScanControls({
  onBarcode,
  onBackPhoto,
  torchSupported,
  torchOn,
  onToggleTorch,
  autoFocusManual = false,
}: {
  onBarcode: (barcode: string) => void;
  onBackPhoto: (file: File) => void;
  torchSupported: boolean;
  torchOn: boolean;
  onToggleTorch: () => void;
  /** Fallback state opens the manual input immediately and focuses it. */
  autoFocusManual?: boolean;
}) {
  const [manualOpen, setManualOpen] = useState(autoFocusManual);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (manualOpen) inputRef.current?.focus();
  }, [manualOpen]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = value.trim();
    if (code) onBarcode(code);
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 px-6 pb-8">
      {manualOpen && (
        <form onSubmit={submit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="Masukkan barkod · Enter barcode"
            aria-label="Barcode number"
            className="h-11 flex-1 border-paper/25 bg-ink/60 font-mono text-paper placeholder:text-paper/40 focus-visible:border-reveal"
          />
          <Button
            type="submit"
            size="lg"
            className="h-11 bg-reveal px-5 font-mono text-xs uppercase tracking-widest text-ink hover:bg-reveal/90"
          >
            Hurai
          </Button>
        </form>
      )}

      {/* OCR escape hatch: camera snap OR gallery upload — works when the barcode won't. */}
      <div className="flex gap-2">
        <SnapLabelButton onPhoto={onBackPhoto} className="flex-1" />
        <GalleryButton onPhoto={onBackPhoto} className="flex-1" />
      </div>

      <div className="flex items-center justify-center gap-3">
        {!manualOpen && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setManualOpen(true)}
            className="h-11 border-paper/25 bg-ink/50 px-5 font-mono text-xs uppercase tracking-widest text-paper hover:bg-ink/70 hover:text-paper"
          >
            Masukkan barkod · Enter code
          </Button>
        )}

        {torchSupported && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-pressed={torchOn}
            aria-label={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
            onClick={onToggleTorch}
            className={`h-11 w-11 border-paper/25 bg-ink/50 hover:bg-ink/70 ${
              torchOn ? "text-reveal" : "text-paper"
            }`}
          >
            <TorchIcon />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * NoCameraFallback — camera denied / unavailable. Reuses the redaction idiom: a
 * mono classified eyebrow over an invitation to type a barcode. The manual input
 * is auto-focused so the full flow stays reachable — never a dead end (§9).
 */
export function NoCameraFallback({
  onBarcode,
  onBackPhoto,
}: {
  onBarcode: (barcode: string) => void;
  onBackPhoto: (file: File) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = value.trim();
    if (code) onBarcode(code);
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink px-8 text-center">
      <span className="type-eyebrow mb-4 text-reveal">
        TIADA KAMERA · NO CAMERA
      </span>
      <p className="mb-8 max-w-xs text-paper/80">
        Kami tak dapat capai kamera. Masukkan nombor barkod untuk teruskan.
        <span className="mt-1 block text-sm text-paper/50">
          We can&apos;t reach the camera. Type the barcode number to continue.
        </span>
      </p>
      <form onSubmit={submit} className="flex w-full max-w-xs gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Masukkan barkod · Enter barcode"
          aria-label="Barcode number"
          className="h-11 flex-1 border-paper/25 bg-ink/60 font-mono text-paper placeholder:text-paper/40 focus-visible:border-reveal"
        />
        <Button
          type="submit"
          size="lg"
          className="h-11 bg-reveal px-5 font-mono text-xs uppercase tracking-widest text-ink hover:bg-reveal/90"
        >
          Hurai
        </Button>
      </form>

      <span className="my-5 font-mono text-xs uppercase tracking-widest text-paper/40">
        atau · or
      </span>
      <div className="flex w-full max-w-xs gap-2">
        <SnapLabelButton onPhoto={onBackPhoto} className="flex-1" />
        <GalleryButton onPhoto={onBackPhoto} className="flex-1" />
      </div>
    </div>
  );
}

function LabelIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M14.5 4h-5L4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9l-5.5-5Z" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  );
}

function TorchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8 2h8l-1 9H9L8 2Z" />
      <path d="M9 11c0 2 1 3 3 3s3-1 3-3" />
    </svg>
  );
}

export default ScanControls;
