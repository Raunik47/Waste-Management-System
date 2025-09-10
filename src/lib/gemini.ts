import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Types
 */
export interface WasteAnalysis {
  wasteType: string;
  quantity: string;
  confidence: number;
}

export interface WasteVerification {
  wasteTypeMatch: boolean;
  quantityMatch: boolean;
  confidence: number;
}

/**
 * Utility: fetch image and convert to base64
 */
async function imageToBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error("Failed to fetch image");
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const ext = imageUrl.split(".").pop()?.toLowerCase();
  const mimeType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
      ? "image/webp"
      : "image/jpeg";

  return { base64: buffer.toString("base64"), mimeType };
}

/**
 * ✅ 1. Analyze Waste for reporting
 * Used in `report.tsx`
 */
export async function analyzeWaste(imageUrl: string): Promise<WasteAnalysis> {
  try {
    const { base64, mimeType } = await imageToBase64(imageUrl);

   const prompt = `
You are an expert in waste management and recycling. Analyze this image carefully and provide:

1. A **detailed description of the waste items** (not just a category, but specific contents and materials visible). Example: "Organic food waste (leftover meal containing lentils, flatbread, and sauce), Stainless steel tray and spoon".
2. The estimated **quantity** (with unit, e.g., "0.5 kg", "2 liters").
3. Your confidence level in this assessment (as a number between 0 and 1).

Respond ONLY in JSON format like this:
{
  "wasteType": "Detailed description of the waste items",
  "quantity": "estimated quantity with unit",
  "confidence": confidence level as a number between 0 and 1
}
`;


    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64, mimeType } },
    ]);

    const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No response from Gemini");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");

    const parsed = JSON.parse(match[0]);

    if (!parsed.wasteType || !parsed.quantity || typeof parsed.confidence !== "number") {
      throw new Error("Invalid JSON structure from Gemini");
    }

    return parsed as WasteAnalysis;
  } catch (error) {
    console.error("Gemini analyzeWaste error:", error);
    throw new Error("Could not analyze the image. Try again or upload a clearer photo.");
  }
}

/**
 * ✅ 2. Verify Waste for collection
 * Used in `collect.tsx`
 */
export async function verifyWaste(
  imageUrl: string,
  expected: { wasteType: string; amount: string }
): Promise<WasteVerification> {
  try {
    const { base64, mimeType } = await imageToBase64(imageUrl);

    const prompt = `
      You are an expert in waste management and recycling.
      Analyze this image and provide:
      1. Confirm if the waste type matches: ${expected.wasteType}
      2. Confirm if the estimated quantity matches: ${expected.amount}
      3. Your confidence level in this assessment (as a number between 0 and 1)

      Respond ONLY in JSON format:
      {
        "wasteTypeMatch": true/false,
        "quantityMatch": false/true,
        "confidence": 0.82
      }
    `;

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { data: base64, mimeType } },
    ]);

    const text = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("No response from Gemini");

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");

    const parsed = JSON.parse(match[0]);

    if (
      typeof parsed.wasteTypeMatch !== "boolean" ||
      typeof parsed.quantityMatch !== "boolean" ||
      typeof parsed.confidence !== "number"
    ) {
      throw new Error("Invalid JSON structure from Gemini");
    }

    return parsed as WasteVerification;
  } catch (error) {
    console.error("Gemini verifyWaste error:", error);
    throw new Error("Could not verify the image. Try again or upload a clearer photo.");
  }
}
