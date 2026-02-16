import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || "***REMOVED***";
const genAI = new GoogleGenerativeAI(API_KEY);

const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { image, prompt } = JSON.parse(event.body || '{}');

        if (!image || !prompt) {
            return { statusCode: 400, body: 'Missing image or prompt' };
        }

        // Try Flash 1.5 first (Fastest/Smartest)
        let modelName = "gemini-1.5-flash-latest";
        // If user specifically asked for Pro Vision fallback logic handle it?
        // Let's keep it simple: Try Flash 1.5. If it fails, catch and try Pro Vision.

        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: image,
                        mimeType: "image/jpeg",
                    },
                },
            ]);
            const response = await result.response;
            const text = response.text();
            return {
                statusCode: 200,
                body: JSON.stringify({ text }),
            };
        } catch (flashError: any) {
            console.warn(`Flash failed: ${flashError.message}. Trying Pro Vision.`);
            // Fallback
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
            const result = await fallbackModel.generateContent([
                prompt,
                {
                    inlineData: {
                        data: image,
                        mimeType: "image/jpeg",
                    },
                },
            ]);
            const response = await result.response;
            const text = response.text();
            return {
                statusCode: 200,
                body: JSON.stringify({ text }),
            };
        }

    } catch (error: any) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Unknown error" }),
        };
    }
};

export { handler };
