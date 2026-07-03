"use client";

/**
 * BackBar — a lightweight top-of-screen back affordance for surfaces that sit
 * OUTSIDE the (app) BottomNav shell (product verdict, share, auth). Uses
 * router.back() when there's history; falls back to a route for deep-link entry
 * (e.g. arriving straight on /product/<barcode> from a shared card). Mono,
 * ink-40 chrome (design-system §4). No animation (that's S8).
 */

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackBar({
  fallback = "/",
  label = "Kembali · Back",
}: {
  fallback?: string;
  label?: string;
}) {
  const router = useRouter();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-4">
      <button
        type="button"
        onClick={goBack}
        aria-label="Kembali · Back"
        className="inline-flex items-center gap-1 font-mono text-sm uppercase tracking-[0.12em] text-ink-40 transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        {label}
      </button>
    </div>
  );
}

export default BackBar;
