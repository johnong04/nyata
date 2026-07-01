/**
 * Barcode detection seam. Imports the `barcode-detector` PONYFILL, which no-ops
 * when the platform already ships a native `BarcodeDetector` (CLAUDE.md gotcha) —
 * so we get native speed where available and a WASM fallback everywhere else.
 *
 * Client-only: the detector reads pixels from a live <video>, so callers live in
 * `"use client"` files. No secrets, no network.
 */
import { BarcodeDetector } from "barcode-detector/ponyfill";

/** Retail formats we care about for Malaysian packaged goods. */
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] as const;

export function makeDetector() {
  return new BarcodeDetector({ formats: [...FORMATS] });
}

/**
 * Detect the first barcode in a video frame. Returns its raw string value, or
 * `null` if none is found. Never throws — a detector hiccup just means "no read
 * this frame," and the scan loop tries again.
 */
export async function detectBarcode(
  detector: BarcodeDetector,
  source: CanvasImageSource
): Promise<string | null> {
  try {
    const results = await detector.detect(source);
    return results.length > 0 ? results[0].rawValue : null;
  } catch {
    return null;
  }
}
