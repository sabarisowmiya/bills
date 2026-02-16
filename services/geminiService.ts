import { GoogleGenerativeAI } from "@google/generative-ai";
import { Bill } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from "./storage";

// Initialize Gemini Client (Stable SDK)
// Note: This key is exposed in client-side code, which is acceptable for this user's context but usually discouraged.
const API_KEY = "***REMOVED***";
const genAI = new GoogleGenerativeAI(API_KEY);

const getPrompt = (shopNames: string, productNames: string) => `
  Analyze this bill image. Extract the Shop Name, Invoice Number, Date, and all Product Items.
  
  CONTEXT:
  1. SHOP NAME: The bill belongs to one of these known shops: [${shopNames}]. 
     - Try to match the text on the bill to one of these exact names. 
     - If it doesn't match exactly, provide the closest match or the raw text.
  
  2. PRODUCTS: The company only sells these specific products: [${productNames}].
     - For each item on the bill, you MUST try to map it to one of the exact names in the list above.
     - Example: If bill says "Coke" and list has "Coca Cola", return "Coca Cola".
     - If the item on the bill is completely different and cannot be mapped, return the raw text found on the bill so the user can fix it.
  
  For each item, extract:
  - Name (Mapped to the known list if possible)
  - Retail Price (Rate)
  - Quantity
  - Total
  
  Ensure numeric values are numbers.

  RETURN JSON ONLY in the following format:
  {
    "shopName": "string",
    "invoiceNumber": "string",
    "date": "YYYY-MM-DD",
    "items": [
      { "productName": "string", "retailPrice": number, "quantity": number, "total": number }
    ],
    "totalAmount": number
  }
`;

export const extractBillData = async (base64Image: string): Promise<Partial<Bill>> => {
  try {
    const products = StorageService.getProducts();
    const shops = StorageService.getShops();

    const productNames = products.map(p => p.name).join(', ');
    const shopNames = shops.map(s => s.name).join(', ');

    const prompt = getPrompt(shopNames, productNames);

    let text = "";

    // Check if we are running on localhost (dev environment)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal) {
      console.log("Local environment detected. Using direct Gemini API call.");
      // Use Stable SDK directly (Works locally where region allows)
      // Fallback strategy for local as well
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      try {
        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]);
        text = result.response.text();
      } catch (localError: any) {
        console.warn("Local Flash failed, trying Pro Vision...", localError);
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        const result = await fallbackModel.generateContent([
          prompt,
          { inlineData: { mimeType: "image/jpeg", data: base64Image } }
        ]);
        text = result.response.text();
      }

    } else {
      console.log("Production environment detected. Using Netlify Function proxy to bypass region restrictions.");
      // Call the serverless function
      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        body: JSON.stringify({
          image: base64Image,
          prompt: prompt
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      // The function returns { text: "..." } or { error: "..." } - checked above
      // Wait, check analyze.ts returns { text: string } inside body, but body is stringified JSON.
      // Wait, typical lambda response body is stringified.
      // But fetch response.json() parses the lambda response BODY automatically if Netlify handles it right?
      // Actually, Netlify functions return body as string. The browser fetch receives that string as the payload.
      // So response.json() parses that payload.
      // My analyze.ts returns: return { statusCode: 200, body: JSON.stringify({ text }) };
      // So response.json() will be { text: "JSON string..." }

      if (data.text) {
        text = data.text;
      } else {
        throw new Error("Invalid response from server function");
      }
    }

    if (!text) throw new Error("No text returned from AI");

    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.log("Raw Text:", text);
      throw new Error("Failed to parse AI response. The bill might be unclear.");
    }

    // Hydrate with IDs
    const items = (data.items || []).map((item: any) => ({
      ...item,
      id: uuidv4(),
      retailPrice: item.retailPrice || (item.total && item.quantity ? item.total / item.quantity : 0),
    }));

    return {
      id: uuidv4(),
      shopName: data.shopName || "",
      invoiceNumber: data.invoiceNumber || "",
      date: data.date || new Date().toISOString().split('T')[0],
      items: items,
      totalAmount: data.totalAmount || 0,
      createdAt: Date.now(),
    };

  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    throw new Error(error.message || "Unknown error during AI extraction");
  }
};