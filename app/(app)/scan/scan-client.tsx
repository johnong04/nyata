"use client";

/**
 * ScanClient — owns the camera, the barcode detection loop, the analyzing loader,
 * and the route out to the verdict. Camera work needs browser APIs, so this whole
 * flow is client-only (no secrets touched — S3 is camera + routing).
 *
 * State machine (flat union): idle → scanning → analyzing → route out; error is
 * the no-camera fallback. Both auto-detect and manual entry funnel through
 * onBarcode — one code path.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getProductByBarcode, getVerdictFromPhotos } from "@/lib/api";
import { makeDetector, detectBarcode } from "@/lib/barcode";
import { fileToDownscaledDataUrl } from "@/lib/image";
import { Reticle } from "@/components/scan/reticle";
import { Analyzing } from "@/components/scan/analyzing";
import { ScanControls, NoCameraFallback } from "@/components/scan/scan-controls";
import { ScanGuide } from "@/components/scan/scan-guide";
import { OcrFailed } from "@/components/scan/ocr-failed";

// idle → scanning → analyzing → route out (OFF hit) OR analyzing → capture-back →
// capture-front → reading → route out (OFF miss / snap). "reading" is the OCR twin
// of "analyzing"; "ocr-failed" is its friendly retry dead-stop. "error" = no camera.
type ScanState =
  | "idle"
  | "scanning"
  | "analyzing"
  | "capture-back"
  | "capture-front"
  | "reading"
  | "ocr-failed"
  | "error";

const DETECT_INTERVAL_MS = 300;

export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastDetectRef = useRef(0);
  const pendingBarcode = useRef<string | null>(null);

  const [state, setState] = useState<ScanState>("idle");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  // The OCR round-trip promise the "reading" loader waits on, and where it lands.
  const ocrRef = useRef<Promise<{ barcode: string; ok: boolean }> | null>(null);
  const ocrResultRef = useRef<{ barcode: string; ok: boolean } | null>(null);
  // OFF-miss branch: the barcode we're capturing photos for (null = pure snap,
  // synthetic key), plus the downscaled photos.
  const captureBarcode = useRef<string | null>(null);
  const backPhoto = useRef<string | null>(null);
  const frontPhoto = useRef<string | null>(null);
  const productHit = useRef(false);
  const lookupRef = useRef<Promise<unknown> | null>(null);

  /** Stop every media track and cancel the detection loop. Idempotent. */
  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  /** The single funnel: auto-detect and manual entry both land here. */
  const onBarcode = useCallback(
    (barcode: string) => {
      if (state === "analyzing") return;
      pendingBarcode.current = barcode;
      captureBarcode.current = barcode;
      // Free the camera BEFORE leaving — a leaked camera light looks broken on film.
      stopCamera();
      productHit.current = false;
      // Resolve product WHILE the loader plays; the loader's waitFor gate holds
      // onComplete until this settles, then we branch hit → route / miss → capture.
      lookupRef.current = getProductByBarcode(barcode)
        .then((p) => {
          productHit.current = Boolean(p);
          return p;
        })
        .catch(() => {
          productHit.current = false;
          return null;
        });
      setState("analyzing");
    },
    [state, stopCamera]
  );

  const onAnalyzeComplete = useCallback(() => {
    const barcode = pendingBarcode.current;
    if (!barcode) return;
    if (productHit.current) {
      router.push(`/product/${encodeURIComponent(barcode)}`);
    } else {
      // OFF miss → guided first-discovery capture, cached under the real barcode.
      backPhoto.current = null;
      frontPhoto.current = null;
      setState("capture-back");
    }
  }, [router]);

  /**
   * Fire the photo→verdict round-trip (back photo, optional front photo, cached
   * under the real barcode when we have one, else a synthetic key). The "reading"
   * loader's waitFor gate holds the un-redaction until this settles.
   */
  const runPhotoVerdict = useCallback(() => {
    ocrResultRef.current = null;
    const run = getVerdictFromPhotos({
      barcode: captureBarcode.current ?? undefined,
      backPhoto: backPhoto.current ?? undefined,
      frontPhoto: frontPhoto.current ?? undefined,
    })
      .then((res) => {
        ocrResultRef.current = res;
        return res;
      })
      .catch(() => {
        const res = { barcode: "", ok: false };
        ocrResultRef.current = res;
        return res;
      });
    ocrRef.current = run;
    setState("reading");
  }, []);

  /**
   * Back-photo handler — shared by the guide's back phase AND ScanControls'
   * snap/gallery. When there's no barcode (pure snap), captureBarcode stays null →
   * synthetic key. Advances to the front-photo phase.
   */
  const onBackPhoto = useCallback(async (file: File) => {
    stopCamera();
    try {
      backPhoto.current = await fileToDownscaledDataUrl(file);
    } catch {
      backPhoto.current = null;
    }
    setState("capture-front");
  }, [stopCamera]);

  const onFrontPhoto = useCallback(
    async (file: File) => {
      try {
        frontPhoto.current = await fileToDownscaledDataUrl(file);
      } catch {
        frontPhoto.current = null;
      }
      runPhotoVerdict();
    },
    [runPhotoVerdict],
  );

  const onSkipFront = useCallback(() => {
    frontPhoto.current = null;
    runPhotoVerdict();
  }, [runPhotoVerdict]);

  const onReadComplete = useCallback(() => {
    const res = ocrResultRef.current;
    if (res?.ok && res.barcode) {
      router.push(`/product/${encodeURIComponent(res.barcode)}`);
    } else {
      setState("ocr-failed");
    }
  }, [router]);

  // Mount: request the camera.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setState("error");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        // Feature-detect torch (Android Chrome only; hidden otherwise).
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as
          | (MediaTrackCapabilities & { torch?: boolean })
          | undefined;
        setTorchSupported(Boolean(caps?.torch));
        setState("scanning");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [stopCamera]);

  // Detection loop — only while scanning and the video has data.
  useEffect(() => {
    if (state !== "scanning") return;
    const detector = makeDetector();

    const tick = async (now: number) => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && now - lastDetectRef.current > DETECT_INTERVAL_MS) {
        lastDetectRef.current = now;
        const code = await detectBarcode(detector, video);
        if (code) {
          onBarcode(code);
          return; // loop cancelled via stopCamera in onBarcode
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state, onBarcode]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        // torch is a non-standard constraint; cast through unknown.
        advanced: [{ torch: next }],
      } as unknown as MediaTrackConstraints);
      setTorchOn(next);
    } catch {
      // Best-effort — never throw. Leave the toggle as-is.
    }
  }, [torchOn]);

  return (
    <div className="fixed inset-x-0 top-0 bottom-[5.5rem] z-30 mx-auto flex max-w-md flex-col overflow-hidden rounded-b-2xl bg-ink">
      {/* Camera stage. */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />

      {state === "scanning" && (
        <>
          <Reticle />
          <ScanControls
            onBarcode={onBarcode}
            onBackPhoto={onBackPhoto}
            torchSupported={torchSupported}
            torchOn={torchOn}
            onToggleTorch={toggleTorch}
          />
        </>
      )}

      {state === "error" && (
        <NoCameraFallback onBarcode={onBarcode} onBackPhoto={onBackPhoto} />
      )}

      {state === "analyzing" && (
        <Analyzing
          waitFor={lookupRef.current ?? undefined}
          onComplete={onAnalyzeComplete}
        />
      )}

      {state === "capture-back" && (
        <ScanGuide phase="back" onPhoto={onBackPhoto} />
      )}
      {state === "capture-front" && (
        <ScanGuide phase="front" onPhoto={onFrontPhoto} onSkip={onSkipFront} />
      )}

      {state === "reading" && (
        <Analyzing
          mode="ocr"
          waitFor={ocrRef.current ?? undefined}
          onComplete={onReadComplete}
        />
      )}

      {state === "ocr-failed" && (
        <OcrFailed
          onRetry={() => setState("scanning")}
          onBackPhoto={onBackPhoto}
        />
      )}
    </div>
  );
}

export default ScanClient;
