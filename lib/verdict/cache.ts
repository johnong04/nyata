import "server-only";
import type { Flag, Product } from "@/lib/types";
import { bandForRating } from "@/lib/types";
import { createServiceClient } from "@/utils/supabase/service";
import { withDisclaimers } from "./copy";
import type { VerdictWithCopy } from "./types";

/**
 * Best-effort Supabase cache for products + verdicts, via the SERVICE-ROLE
 * client (writes past RLS — the tables are public-read but write-locked).
 * Every call is wrapped: a missing env / DB error degrades to null / no-op,
 * never throws. The cache is an optimization, never on the critical path.
 *
 * Disclaimers are NOT stored (the `verdicts` table has no such columns); they
 * are re-attached on read from `copy.ts` so the legal text stays ours + editable.
 */

function client() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      return null;
    }
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function getCachedProduct(barcode: string): Promise<Product | null> {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("barcode, name, brand, ingredients_raw, source, cached_at")
      .eq("barcode", barcode)
      .maybeSingle();
    if (error || !data) return null;
    return {
      barcode: data.barcode,
      name: data.name ?? "",
      brand: data.brand ?? "",
      ingredients_raw: data.ingredients_raw ?? "",
      source: data.source === "ocr" ? "ocr" : "off",
      cached_at: data.cached_at,
    };
  } catch {
    return null;
  }
}

export async function upsertProduct(p: Product): Promise<void> {
  const supabase = client();
  if (!supabase) return;
  try {
    await supabase.from("products").upsert(
      {
        barcode: p.barcode,
        name: p.name || null,
        brand: p.brand || null,
        ingredients_raw: p.ingredients_raw || null,
        source: p.source,
      },
      { onConflict: "barcode" },
    );
  } catch {
    // best-effort
  }
}

export async function getCachedVerdict(barcode: string): Promise<VerdictWithCopy | null> {
  const supabase = client();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("verdicts")
      .select("flags, rating, verdict, summary_bm, summary_en")
      .eq("product_id", barcode)
      .maybeSingle();
    if (error || !data) return null;
    return withDisclaimers({
      flags: (data.flags as unknown as Flag[]) ?? [],
      rating: data.rating,
      summary_bm: data.summary_bm ?? "",
      summary_en: data.summary_en ?? "",
    });
  } catch {
    return null;
  }
}

export async function upsertVerdict(
  barcode: string,
  v: { flags: Flag[]; rating: number; summary_bm: string; summary_en: string },
  model: string,
): Promise<void> {
  const supabase = client();
  if (!supabase) return;
  try {
    await supabase.from("verdicts").upsert(
      {
        product_id: barcode,
        flags: v.flags as unknown as import("@/utils/supabase/database.types").Json,
        rating: v.rating,
        verdict: bandForRating(v.rating),
        summary_bm: v.summary_bm,
        summary_en: v.summary_en,
        model,
      },
      { onConflict: "product_id" },
    );
  } catch {
    // best-effort
  }
}
