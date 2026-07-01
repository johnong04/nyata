import "server-only";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { ocrSchema } from "./schema";

/**
 * OCR fallback: when OpenFoodFacts misses, read the ingredient list off a label
 * photo with Gemini vision. Returns the raw ingredient text, or null on any
 * failure (missing key / no image / model error). Never throws.
 *
 * `labelPhoto` is a base64 data URL (`data:image/...;base64,...`) or a bare
 * base64 string; passed to the model as an image file part.
 */
const MODEL = "gemini-2.5-flash";

export async function ocrIngredients(labelPhoto: string): Promise<string | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;
  if (!labelPhoto) return null;

  try {
    const result = await generateObject({
      model: google(MODEL),
      schema: ocrSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Read the INGREDIENTS list from this product label photo. " +
                "Return ONLY the ingredient text exactly as printed (any language). " +
                "If no ingredient list is visible, return an empty string.",
            },
            { type: "image", image: labelPhoto },
          ],
        },
      ],
    });
    const text = result.object.ingredients_text?.trim();
    return text ? text : null;
  } catch (err) {
    console.warn("[verdict/ocr] failed:", err);
    return null;
  }
}
