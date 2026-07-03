import "server-only";
import { google } from "@ai-sdk/google";
import { generateText, type Tool } from "ai";
import type { Dossier } from "@/lib/types";
import { normalize } from "@/lib/recalls/normalize";
import { dossierRawSchema } from "./schema";
import {
  DOSSIER_SYSTEM,
  buildDossierPrompt,
  SAFE_HEDGE_BM,
  SAFE_HEDGE_EN,
} from "./prompt";
import { ensureHedged, gateSources, hostOf } from "./gate";

const MODEL = "gemini-2.5-flash";

/** Pull the first fenced ```json block (or a bare object) out of model text. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/**
 * Single Google-Search-grounded Gemini call → validated, credibility-gated
 * dossier. Returns null (honest empty) on: no key, model/parse failure, or zero
 * sources surviving the gate. Never throws.
 */
export async function fetchDossier(input: {
  brand: string;
  name: string;
}): Promise<Dossier | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;
  const brand_key = normalize(input.brand) || normalize(input.name);
  if (!brand_key) return null;

  try {
    const { text, sources } = await generateText({
      model: google(MODEL),
      // @ai-sdk/google v2 types its grounding tool against the SharedV2 provider
      // spec; ai v6's generateText wants V3. The runtime shape is compatible —
      // bridge the version gap with a scoped cast rather than pinning versions.
      tools: { google_search: google.tools.googleSearch({}) as unknown as Tool },
      system: DOSSIER_SYSTEM,
      prompt: buildDossierPrompt(input),
    });

    const parsed = dossierRawSchema.safeParse(extractJson(text));
    if (!parsed.success) return null;

    // Grounded citation hosts = the real search results Google returned.
    const groundedHosts = new Set(
      (sources ?? [])
        .map((s) => (typeof (s as { url?: string }).url === "string" ? hostOf((s as { url: string }).url) : ""))
        .filter(Boolean),
    );

    const gated = gateSources(parsed.data.sources, groundedHosts);
    if (gated.length === 0) return null; // honest empty — no attributed source survived

    return {
      brand_key,
      summary_en: ensureHedged(parsed.data.summary_en, SAFE_HEDGE_EN),
      summary_bm: ensureHedged(parsed.data.summary_bm, SAFE_HEDGE_BM),
      sources: gated,
      prewarmed: false,
    };
  } catch (err) {
    console.warn("[dossier/gemini] failed:", err);
    return null;
  }
}
