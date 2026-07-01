/**
 * /share/:barcode — the share stage (S2 verdict CTA links here). Previews the
 * flat 1080×1350 export rendered by /api/share-card/:barcode, then offers the
 * "Post to Story" flow. Server component: resolves the product name for the
 * share text; the API route owns the pixels.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductByBarcode } from "@/lib/api";
import { ShareButton } from "@/components/share/ShareButton";

export default async function SharePage({
  params,
}: {
  params: Promise<{ barcode: string }>;
}) {
  const { barcode } = await params;
  const product = await getProductByBarcode(barcode);
  if (!product) notFound();

  return (
    <main className="bg-document mx-auto flex max-w-md flex-col gap-6 bg-paper p-4">
      <header className="rounded-none bg-ink px-4 py-3 text-paper">
        <span className="type-eyebrow text-paper/60">
          KONGSI · SHARE THE FILE
        </span>
        <h1 className="font-display text-xl font-bold leading-tight">
          {product.name}
        </h1>
      </header>

      {/* Preview of the flat export (4:5). The API route is the source of truth. */}
      <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/share-card/${encodeURIComponent(barcode)}`}
          alt={`Nyata verdict card for ${product.name}`}
          width={1080}
          height={1350}
          className="block h-auto w-full"
        />
      </div>

      <ShareButton barcode={barcode} productName={product.name} />

      <Link
        href={`/product/${encodeURIComponent(barcode)}`}
        className="type-mono text-center text-ink-40 hover:text-ink"
      >
        ← Kembali ke verdik · Back to verdict
      </Link>
    </main>
  );
}
