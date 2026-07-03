import "server-only";
import type { Dossier, DossierSource } from "@/lib/types";
import { createServiceClient } from "@/utils/supabase/service";

function client() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return null;
    return createServiceClient();
  } catch {
    return null;
  }
}

export async function getCachedDossier(brandKey: string): Promise<Dossier | null> {
  const supabase = client();
  if (!supabase || !brandKey) return null;
  try {
    const { data, error } = await supabase
      .from("dossiers")
      .select("brand_key, summary_en, summary_bm, sources, prewarmed")
      .eq("brand_key", brandKey)
      .maybeSingle();
    if (error || !data) return null;
    return {
      brand_key: data.brand_key,
      summary_en: data.summary_en ?? "",
      summary_bm: data.summary_bm ?? "",
      sources: (data.sources as unknown as DossierSource[]) ?? [],
      prewarmed: data.prewarmed ?? false,
    };
  } catch {
    return null;
  }
}

export async function upsertDossier(
  d: Dossier,
  opts?: { productBarcode?: string; model?: string },
): Promise<void> {
  const supabase = client();
  if (!supabase) return;
  try {
    await supabase.from("dossiers").upsert(
      {
        brand_key: d.brand_key,
        product_barcode: opts?.productBarcode ?? null,
        summary_en: d.summary_en,
        summary_bm: d.summary_bm,
        sources: d.sources as unknown as import("@/utils/supabase/database.types").Json,
        prewarmed: d.prewarmed,
        model: opts?.model ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_key" },
    );
  } catch {
    // best-effort
  }
}
