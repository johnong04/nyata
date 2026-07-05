import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

/**
 * Shared vision+text model for OCR and the verdict. Routed through OpenRouter
 * (not the free Gemini tier, which is throttled to ~0 free_tier requests and
 * makes scanning unreliable in prod) using a multimodal model. Cheap: ~$0.001
 * per scan (OCR image + verdict text), well within the demo budget.
 */
export const OCR_MODEL_ID = "openrouter:google/gemini-2.5-flash";

export function aiModel() {
  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  return openrouter.chat("google/gemini-2.5-flash");
}
