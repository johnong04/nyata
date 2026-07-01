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
import { getProductByBarcode } from "@/lib/api";
import { makeDetector, detectBarcode } from "@/lib/barcode";
import { Reticle } from "@/components/scan/reticle";
import { Analyzing } from "@/components/scan/analyzing";
import { ScanControls, NoCameraFallback } from "@/components/scan/scan-controls";

type ScanState = "idle" | "scanning" | "analyzing" | "error";

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
      // Free the camera BEFORE leaving — a leaked camera light looks broken on film.
      stopCamera();
      // Kick the lookup in parallel with the loader (perceived-latency cover).
      void getProductByBarcode(barcode).catch(() => null);
      setState("analyzing");
    },
    [state, stopCamera]
  );

  const onAnalyzeComplete = useCallback(() => {
    const barcode = pendingBarcode.current;
    if (!barcode) return;
    router.push(`/product/${encodeURIComponent(barcode)}`);
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
            torchSupported={torchSupported}
            torchOn={torchOn}
            onToggleTorch={toggleTorch}
          />
        </>
      )}

      {state === "error" && <NoCameraFallback onBarcode={onBarcode} />}

      {state === "analyzing" && <Analyzing onComplete={onAnalyzeComplete} />}
    </div>
  );
}

export default ScanClient;
