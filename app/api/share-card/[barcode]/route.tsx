/**
 * GET /api/share-card/:barcode → the flat 1080×1350 (4:5) share PNG.
 * Renders server-side via @vercel/og (Satori + resvg) — deterministic, no
 * browser DOM. Reads data through the S1 seam so mock today, real later with no
 * route change. Node runtime: most reliable for resvg font handling.
 */
import { ImageResponse } from "@vercel/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  getProductByBarcode,
  getVerdict,
  getRecallsForProduct,
  getDossierCached,
} from "@/lib/api";
import { buildShareCard } from "@/lib/share-card/buildShareCard";
import { primaryRecall } from "@/lib/share-card/verdictMeta";

export const runtime = "nodejs";

function font(file: string) {
  return readFile(join(process.cwd(), "public", "fonts", file));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;

  const product = await getProductByBarcode(barcode);
  if (!product) {
    return new Response("Product not found", { status: 404 });
  }
  const [verdict, recalls, dossier] = await Promise.all([
    getVerdict(barcode),
    getRecallsForProduct(product),
    getDossierCached({ brand: product.brand, name: product.name }),
  ]);

  const [bricolage, monoRegular, monoBold] = await Promise.all([
    font("BricolageGrotesque-ExtraBold.ttf"),
    font("SpaceMono-Regular.ttf"),
    font("SpaceMono-Bold.ttf"),
  ]);

  return new ImageResponse(
    buildShareCard({
      barcode,
      productName: product.name,
      brand: product.brand,
      verdict,
      recall: primaryRecall(recalls),
      onTheRecord: Boolean(dossier?.sources.length),
    }),
    {
      width: 1080,
      height: 1350,
      fonts: [
        { name: "Bricolage Grotesque", data: bricolage, weight: 800, style: "normal" },
        { name: "Space Mono", data: monoRegular, weight: 400, style: "normal" },
        { name: "Space Mono", data: monoBold, weight: 700, style: "normal" },
      ],
    }
  );
}
