import { notFound } from "next/navigation";
import {
  getProductByBarcode,
  getVerdict,
  getRecallsForProduct,
  logScan,
} from "@/lib/api";
import { VerdictDetail } from "@/components/nyata/verdict-detail";
import { BackBar } from "@/components/nyata/back-bar";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ barcode: string }>;
}) {
  const { barcode } = await params; // Next 16: params is async
  const product = await getProductByBarcode(barcode);
  if (!product) notFound();
  // Log the scan for signed-in users (users metric). No-op for guests; never
  // blocks the verdict — logScan swallows its own errors.
  await logScan(barcode);
  const [verdict, recalls] = await Promise.all([
    getVerdict(barcode),
    getRecallsForProduct(product),
  ]);
  return (
    <div className="bg-paper">
      <BackBar fallback="/feed" />
      <VerdictDetail product={product} verdict={verdict} recalls={recalls} />
    </div>
  );
}
