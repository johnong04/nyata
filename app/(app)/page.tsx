import Link from "next/link";
import { ScanLine } from "lucide-react";
import { RedactionDemo } from "@/components/nyata/redaction-demo";

export default function HomePage() {
  return (
    <div>
      <header>
        <p className="type-eyebrow">Digital whistleblower · Pemberi maklumat</p>
        <h1 className="type-display mt-3 text-ink">
          Scan the label.
          <br />
          See what&apos;s hidden.
        </h1>
        <p className="mt-4 max-w-prose text-ink-70">
          Imbas produk Malaysia untuk putusan segera tentang bahan tambahan,
          keraguan halal, dan penarikan balik rasmi.
        </p>
      </header>

      <Link
        href="/scan"
        className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-4 font-semibold text-paper transition-transform active:scale-[.98]"
      >
        <ScanLine className="h-5 w-5" />
        Imbas produk · Scan a product
      </Link>

      <RedactionDemo />
    </div>
  );
}
