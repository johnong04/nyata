import { notFound } from "next/navigation";
import {
  getProductByBarcode,
  getVerdict,
  getRecallsForProduct,
} from "@/lib/api";
import { VerdictDetail } from "@/components/nyata/verdict-detail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ barcode: string }>;
}) {
  const { barcode } = await params; // Next 16: params is async
  const product = await getProductByBarcode(barcode);
  if (!product) notFound();
  const [verdict, recalls] = await Promise.all([
    getVerdict(barcode),
    getRecallsForProduct(product),
  ]);
  return <VerdictDetail product={product} verdict={verdict} recalls={recalls} />;
}
