import { ScreenHeader } from "@/components/nyata/screen-header";

export default function ScanPage() {
  return (
    <div>
      <ScreenHeader eyebrow="Imbas · Scan" title="Imbas produk">
        Halakan kamera ke barkod produk. Kami baca label, silang rujuk KKM, dan
        beri putusan.
      </ScreenHeader>
      <p className="type-mono text-ink-40">// camera + barcode reticle land in S3</p>
    </div>
  );
}
