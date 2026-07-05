import "server-only";
import { generateObject } from "ai";
import { ocrSchema } from "./schema";
import { aiModel } from "./model";

/**
 * OCR fallback: when OpenFoodFacts misses, read the identity fields off a label
 * photo with Gemini vision. Returns { name, brand, ingredients } (each may be an
 * empty string if not visible in this photo), or null on any failure (missing key
 * / no image / model error / nothing readable). Never throws.
 *
 * `labelPhoto` is a base64 data URL (`data:image/...;base64,...`) or a bare
 * base64 string; passed to the model as an image file part.
 */
export async function ocrLabel(
  labelPhoto: string,
): Promise<{ name: string; brand: string; ingredients: string } | null> {
  if (!process.env.OPENROUTER_API_KEY) return null;
  if (!labelPhoto) return null;

  try {
    const result = await generateObject({
      model: aiModel(),
      schema: ocrSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Read this product label photo. Extract, exactly as printed (any language): " +
                "product_name (the product's name), brand (manufacturer/brand), and " +
                "ingredients_text (the full ingredients list). Any field not visible in this " +
                "photo: return an empty string for it. Do not guess or invent.",
            },
            { type: "image", image: labelPhoto },
          ],
        },
      ],
    });
    const name = result.object.product_name?.trim() ?? "";
    const brand = result.object.brand?.trim() ?? "";
    const ingredients = result.object.ingredients_text?.trim() ?? "";
    // Nothing readable at all → null so the caller can fall through to a stub.
    if (!name && !brand && !ingredients) return null;
    return { name, brand, ingredients };
  } catch (err) {
    console.warn("[verdict/ocr] failed:", err);
    return null;
  }
}
