import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
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

const MODEL = "google/gemini-2.5-flash";

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
 * Collect the citation hosts OpenRouter's web plugin returned for this call.
 * These are the REAL search results — the credibility gate corroborates each
 * republished claim host against this set (specs §11.2). We read from both
 * shapes the provider can populate, so the gate keeps working across versions:
 *   1. the AI SDK standard `result.sources` ({ sourceType: 'url', url }),
 *   2. OpenRouter's `providerMetadata.openrouter.annotations[].url_citation.url`
 *      (the documented web-plugin citation shape).
 */
function citationHosts(
  sources: unknown,
  providerMetadata: unknown,
): Set<string> {
  const hosts = new Set<string>();
  const add = (u: unknown) => {
    if (typeof u === "string") {
      const h = hostOf(u);
      if (h) hosts.add(h);
    }
  };

  // 1. AI SDK standard `sources` array.
  if (Array.isArray(sources)) {
    for (const s of sources) add((s as { url?: unknown })?.url);
  }

  // 2. OpenRouter web-plugin annotations on provider metadata.
  const annotations = (providerMetadata as {
    openrouter?: { annotations?: unknown };
  })?.openrouter?.annotations;
  if (Array.isArray(annotations)) {
    for (const a of annotations) {
      const ann = a as { url_citation?: { url?: unknown }; url?: unknown };
      add(ann?.url_citation?.url);
      add(ann?.url); // tolerate a flattened shape
    }
  }

  return hosts;
}

/**
 * Single OpenRouter web-plugin call (Gemini 2.5 Flash + Exa web search) →
 * validated, credibility-gated dossier. Returns null (honest empty) on: no key,
 * model/parse failure, or zero sources surviving the gate. Never throws.
 */
export async function fetchDossier(input: {
  brand: string;
  name: string;
}): Promise<Dossier | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  const brand_key = normalize(input.brand) || normalize(input.name);
  if (!brand_key) return null;

  try {
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    const model = openrouter.chat(MODEL, {
      plugins: [{ id: "web", max_results: 5, engine: "exa" }],
    });

    // The web plugin returns prose + citations, so we CAN'T combine it with
    // structured output — use generateText and parse the JSON out ourselves
    // with the existing strict Zod schema (same pattern as grounding).
    const { text, sources, providerMetadata } = await generateText({
      model,
      system: DOSSIER_SYSTEM,
      prompt: buildDossierPrompt(input),
    });

    const parsed = dossierRawSchema.safeParse(extractJson(text));
    if (!parsed.success) return null;

    const groundedHosts = citationHosts(sources, providerMetadata);

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
    console.warn("[dossier/openrouter] failed:", err);
    return null;
  }
}
