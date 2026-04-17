import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

// Create the Gen-3 Gemini Client via the new SDK
const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

// JSON Schema for structured fact-checking output
const responseSchema = {
    type: "OBJECT",
    properties: {
        verdict: {
            type: "STRING",
            description: "Must be TRUE, FALSE, MISLEADING, or UNCERTAIN",
        },
        confidence: {
            type: "INTEGER",
            description: "A numerical percentage from 0 to 100 representing how confident you are in your verdict.",
        },
        explanation: {
            type: "STRING",
            description: "A nuanced, empathetic explanation. If the provided context identifies a specific source article for an image/link, identify it clearly (e.g., 'This image belongs to a report from...') and then summarize the fact-check (max 3 sentences).",
        },
    },
    required: ["verdict", "confidence", "explanation"],
};

// Helper function to fetch remote images and encode as base64 for Gemini
const fetchImageAsBase64 = async (imageUrl) => {
    try {
        console.log(`... Downloading image for Vision analysis: ${imageUrl.substring(0, 50)}...`);
        const response = await fetch(imageUrl);
        const imageArrayBuffer = await response.arrayBuffer();
        const base64ImageData = Buffer.from(imageArrayBuffer).toString('base64');
        return base64ImageData;
    } catch (error) {
        console.error("Failed to fetch image for AI vision:", error.message);
        return null; // Fail gracefully: AI will proceed without the image vision (text-only fallback)
    }
};

export const checkAiReadiness = () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
        throw new Error("GEMINI_API_KEY is not configured in .env");
    }
};

export const evaluateClaim = async (prompt, imageUrl = null) => {
    checkAiReadiness();
    
    try {
        let contents = [];

        // If an image URL is provided, fetch and add as multimodal part
        if (imageUrl) {
            const base64Image = await fetchImageAsBase64(imageUrl);
            if (base64Image) {
                contents.push({
                    inlineData: {
                        mimeType: "image/jpeg", // Standardizing on jpeg for vision
                        data: base64Image
                    }
                });
            }
        }

        // Add text prompt
        contents.push({ text: prompt });

        console.log("---------------- GEMINI PROMPT ----------------");
        console.log(prompt); 
        if (imageUrl) console.log(`[Vision Enabled with Image: ${imageUrl.substring(0, 50)}...]`);
        console.log("-----------------------------------------------");

        // Use gemini-3-flash-preview as per the new documentation
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: contents, // Passing the multimodal array
            config: {
                // Enable Thinking Mode (Low Budget) for better reasoning
                thinkingConfig: {
                    thinkingLevel: ThinkingLevel.LOW,
                },
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        console.log("---------------- GEMINI OUTPUT ----------------");
        console.log(response.text);
        console.log("-----------------------------------------------");

        // Parse and return the structured JSON
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Gemini 3 Error:", error);
        throw new Error("AI analysis failed with the new GenAI SDK.");
    }
};
