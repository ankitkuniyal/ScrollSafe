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

export const analyzeAudio = async (base64Audio, mimeType) => {
    checkAiReadiness();
    
    // Normalize mimeType for common misidentifications
    let normalizedMimeType = mimeType;
    if (mimeType === 'video/mpeg' || mimeType === 'audio/mpeg' || mimeType === 'video/mp4') {
        normalizedMimeType = 'audio/mp3'; // Gemini treats these mpeg streams well as mp3
    }
    
    try {
        const prompt = `
            Process the audio file and provide a detailed transcription and authenticity analysis.
            Requirements:
            1. Provide a highly accurate transcription of the speech.
            2. Evaluate if the audio appears authentic (human-recorded) or if there are signs of it being AI-generated, synthesized, or digitally altered (deepfake).
            3. Provide reasoning for your authenticity assessment based on acoustic anomalies, breathing patterns, or typical deepfake artifacts.
        `;

        const contents = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: normalizedMimeType,
                    data: base64Audio,
                },
            },
        ];

        const response = await client.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        transcription: { type: "STRING", description: "The transcribed text of the audio" },
                        is_authentic: { type: "BOOLEAN", description: "True if the audio appears naturally human-recorded, False if it shows signs of AI generation or tampering" },
                        authenticity_reasoning: { type: "STRING", description: "Brief reasoning for why it was deemed authentic or synthetic" }
                    },
                    required: ["transcription", "is_authentic", "authenticity_reasoning"]
                }
            }
        });

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini 3 Audio Error:", error);
        // Log more details if available in the error object
        if (error.details) console.error("Error Details:", JSON.stringify(error.details, null, 2));
        throw new Error(`Failed to analyze audio authenticity: ${error.message || 'Unknown AI error'}`);
    }
};
