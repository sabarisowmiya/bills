import { GoogleGenAI, Type } from "@google/genai";
import { Bill } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from "./storage";

// Initialize Gemini Client - ORIGINAL WORKING CONFIG
const ai = new GoogleGenAI({ apiKey: "***REMOVED***" });

export const extractBillData = async (base64Image: string): Promise<Partial<Bill>> => {
  try {
    // Fetch known data to guide the AI
    const products = StorageService.getProducts();
    const shops = StorageService.getShops();

    const productNames = products.map(p => p.name).join(', ');
    const shopNames = shops.map(s => s.name).join(', ');

    const prompt = `
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

    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");

    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonString);

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

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};