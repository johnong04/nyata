import { ScreenHeader } from "@/components/nyata/screen-header";

export default function HistoryPage() {
  return (
    <div>
      <ScreenHeader eyebrow="Log · Rekod" title="Sejarah">
        Setiap produk yang anda imbas, tersimpan untuk rujukan.
      </ScreenHeader>
      <p className="type-mono text-ink-40">// scan history lands in a later slice</p>
    </div>
  );
}
