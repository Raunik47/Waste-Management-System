import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface WasteAnalysis {
  wasteType: string[];      // allow multiple categories
  quantity: string;         // always include unit
  confidence: number;       // 0–1
}

export async function verifyWaste(imageUrl: string): Promise<WasteAnalysis> {
  try {
    // 1. Download image
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Failed to fetch image");
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Detect mime type
    const ext = imageUrl.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

    // 3. Convert to Base64
    const base64Image = buffer.toString("base64");

    // 4. Improved prompt
    const prompt = `
      You are an expert in waste management and recycling.

      Analyze the uploaded image carefully and respond ONLY with a valid JSON object.
      Do not include explanations or commentary outside the JSON.

      The JSON must strictly follow this structure:
      {
        "wasteType": ["list of detected waste categories with detail, e.g. 'Plastic bags', 'Organic waste', 'Paper/cardboard'"],
        "quantity": "estimated amount with unit (e.g. '2kg', '500ml', '3 pieces', 'Large pile')",
        "confidence": number between 0 and 1 (e.g. 0.87)
      }

      Rules:
      - wasteType should be an array (even if only one type).
      - Provide descriptive categories, not just generic words like "plastic".
      - Always include a realistic quantity with unit.
      - Confidence must be numeric between 0 and 1.
    `;

    // 5. Generate content
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64Image, mimeType } },
    ]);

    // 6. Extract text safely
    const text =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No response text from Gemini");

    // 7. Extract JSON
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");

    const parsed = JSON.parse(match[0]);

    // 8. Validate shape
    if (
      !parsed.wasteType ||
      !Array.isArray(parsed.wasteType) ||
      !parsed.quantity ||
      typeof parsed.confidence !== "number"
    ) {
      throw new Error("Invalid JSON structure from Gemini");
    }

    return parsed as WasteAnalysis;
  } catch (error) {
    console.error("Gemini verifyWaste error:", error);
    throw new Error(
      "Could not verify the image. Try again or upload a clearer photo."
    );
  }
}
