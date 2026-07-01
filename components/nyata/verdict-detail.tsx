"use client";
import type { Product, Verdict, Recall } from "@/lib/types";

export function VerdictDetail({ product }: { product: Product; verdict: Verdict; recalls: Recall[] }) {
  return <main className="mx-auto max-w-md p-4">{product.name}</main>;
}
