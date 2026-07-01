"use client";

/**
 * ShareButton — the "Post to Story" flow (design-system §6, §8). Fetches the
 * flat share PNG from /api/share-card/:barcode, then Web Share API (level 2,
 * files) with an anchor-download + copy-link fallback. The Aceternity
 * stateful-button drives idle→generating→done: its handler awaits our async
 * onClick, so the loader shows while the image renders and the check on done.
 */
import { Button } from "@/components/ui/stateful-button";
import { deepLink } from "@/lib/share-card/verdictMeta";

export function ShareButton({
  barcode,
  productName,
}: {
  barcode: string;
  productName: string;
}) {
  async function handle() {
    const res = await fetch(`/api/share-card/${encodeURIComponent(barcode)}`);
    if (!res.ok) throw new Error("share render failed");
    const blob = await res.blob();
    const file = new File([blob], `nyata-${barcode}.png`, { type: "image/png" });
    const url = deepLink(barcode);
    const text = `Nyata verdict: ${productName} · scan yours → nyata.app`;

    // Web Share API level 2 (mobile) — share the image + deep link.
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], text, url });
        return;
      } catch {
        // user cancelled or share failed → fall through to download
      }
    }

    // Fallback (desktop): download the PNG + copy the deep link.
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(objectUrl);
    await navigator.clipboard?.writeText(url).catch(() => {});
  }

  return (
    <Button
      onClick={handle}
      className="h-11 w-full rounded-xl bg-ink text-paper hover:ring-ink"
    >
      Post to Story · Kongsi
    </Button>
  );
}
