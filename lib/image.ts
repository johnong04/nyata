/**
 * Client-side image downscaler for the OCR "snap the label" path. Reads a picked
 * File, draws it into a canvas capped at ~1024px on its long edge, and returns a
 * JPEG data URL at ~0.7 quality. Keeps the server-action payload small (a raw
 * phone photo is multiple MB; this lands well under a few hundred KB) without
 * losing the resolution Gemini needs to read an ingredient list.
 *
 * Browser-only (uses Image/canvas). Rejects on a decode failure so the caller can
 * surface a friendly retry rather than shipping a broken payload to the model.
 */

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.7;

export async function fileToDownscaledDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = fit(img.naturalWidth, img.naturalHeight, MAX_EDGE);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = src;
  });
}

/** Scale (w,h) down so the long edge ≤ max; never upscale. */
function fit(w: number, h: number, max: number): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = max / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}
