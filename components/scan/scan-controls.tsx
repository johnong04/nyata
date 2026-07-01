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

export function ScanControls({
  onBarcode,
  torchSupported,
  torchOn,
  onToggleTorch,
  autoFocusManual = false,
}: {
  onBarcode: (barcode: string) => void;
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
}: {
  onBarcode: (barcode: string) => void;
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
    </div>
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
