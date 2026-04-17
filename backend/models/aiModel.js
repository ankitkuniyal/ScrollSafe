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
            description: "A nuanced, empathetic explanation summarizing the context and reasoning (max 2 sentences).",
        },
    },
    required: ["verdict", "confidence", "explanation"],
};

export const checkAiReadiness = () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
        throw new Error("GEMINI_API_KEY is not configured in .env");
    }
};

export const evaluateClaim = async (prompt) => {
    checkAiReadiness();
    
    try {
        // Use gemini-3-flash-preview as per the new documentation
        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                // Enable Thinking Mode (Low Budget) for better reasoning
                thinkingConfig: {
                    thinkingLevel: ThinkingLevel.LOW,
                },
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

        // Parse and return the structured JSON
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Gemini 3 Error:", error);
        throw new Error("AI analysis failed with the new GenAI SDK.");
    }
};
