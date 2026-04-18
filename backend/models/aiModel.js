import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

// Create the Gen-3 Gemini Client via the new SDK
const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

// Current model configuration
const MODEL_NAME = "gemini-2.5-flash-lite";

/**
 * Helper to execute Gemini calls with automatic retry on 429 (Rate Limit) errors.
 * This helps handle quota issues without failing the entire request.
 */
async function executeWithRetry(fn, retries = 3, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            const isQuotaError = error.message.includes("429") || error.message.includes("quota");
            if (isQuotaError && i < retries - 1) {
                console.warn(`⚠️ Gemini Rate Limit (429) hit. Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
                continue;
            }
            throw error;
        }
    }
}

// JSON Schema for structured fact-checking output
const responseSchema = {
    type: Type.OBJECT,
    properties: {
        verdict: {
            type: Type.STRING,
            description: "Must be TRUE, FALSE, or UNCERTAIN",
        },
        confidence: {
            type: Type.INTEGER,
            description: "A numerical percentage from 0 to 100 representing how confident you are in your verdict.",
        },
        explanation: {
            type: Type.STRING,
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

export const evaluateClaim = async (prompt, imageUrl = null, base64ImageInput = null) => {
    checkAiReadiness();
    
    try {
        let finalBase64 = base64ImageInput;
        let mimeType = "image/jpeg"; // Default

        // If no direct base64 provided but we have a URL, fetch it
        if (!finalBase64 && imageUrl) {
            finalBase64 = await fetchImageAsBase64(imageUrl);
            // Rough detection from URL
            if (imageUrl.toLowerCase().endsWith(".png")) mimeType = "image/png";
            else if (imageUrl.toLowerCase().endsWith(".webp")) mimeType = "image/webp";
        }

        const parts = [];
        
        // Add text prompt first
        parts.push({ text: prompt });

        // Add multimodal image part if we have base64 data
        if (finalBase64) {
            parts.push({
                inlineData: {
                    mimeType: mimeType, 
                    data: finalBase64
                }
            });
        }

        console.log("---------------- GEMINI PROMPT ----------------");
        console.log(prompt); 
        if (imageUrl || base64ImageInput) console.log(`[Vision Enabled with ${imageUrl ? 'URL' : 'Local Upload'} - ${mimeType}]`);
        console.log("-----------------------------------------------");

        // Build config conditionally
        const config = {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        };

        // Enable Thinking Mode for supported models
        if (MODEL_NAME.includes("thinking") || MODEL_NAME.includes("gemini-3-flash")) {
            config.thinkingConfig = {
                thinkingLevel: ThinkingLevel.LOW,
            };
        }

        const response = await executeWithRetry(() => client.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: parts }],
            config: config
        }));

        console.log("---------------- GEMINI OUTPUT ----------------");
        console.log(response.text);
        console.log("-----------------------------------------------");

        // Parse and return the structured JSON
        return JSON.parse(response.text);

    } catch (error) {
        console.error("Gemini 3 Error:", error);
        if (error.message.includes("429") || error.message.includes("quota")) {
            console.error("CRITICAL: Gemini API Quota Exceeded. Please check your billing/usage limits.");
        }
        throw new Error(`AI analysis failed: ${error.message}`);
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
            Process the audio file and generate a detailed transcription and authenticity analysis.
            Requirements:
            1. Provide accurate timestamps for each significant segment (Format: MM:SS).
            2. Detect the primary language of the audio.
            3. Evaluate if the audio appears authentic (human-recorded) or if there are signs of it being AI-generated, synthesized, or digitally altered (deepfake).
            4. Provide reasoning based on acoustic anomalies or typical deepfake artifacts.
            5. Generate a concise "primary_query" (5-8 words) for search engine verification.
        `;

        const parts = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: normalizedMimeType,
                    data: base64Audio,
                },
            },
        ];

        const response = await executeWithRetry(() => client.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: parts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcription: { type: Type.STRING, description: "Detailed transcription with timestamps if relevant" },
                        is_authentic: { type: Type.BOOLEAN, description: "True if human-recorded, False if synthetic/tampered" },
                        authenticity_reasoning: { type: Type.STRING },
                        primary_query: { type: Type.STRING, description: "Concise search string" }
                    },
                    required: ["transcription", "is_authentic", "authenticity_reasoning", "primary_query"]
                }
            }
        }));

        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini 3 Audio Error:", error);
        if (error.message.includes("429") || error.message.includes("quota")) {
            console.error("CRITICAL: Gemini API Quota Exceeded. Please check your billing/usage limits.");
        }
        // Log more details if available in the error object
        if (error.details) console.error("Error Details:", JSON.stringify(error.details, null, 2));
        throw new Error(`Failed to analyze audio authenticity: ${error.message || 'Unknown AI error'}`);
    }
};

const fetchVideoAsBase64 = async (videoUrl) => {
    try {
        console.log(`... Downloading video for analysis: ${videoUrl.substring(0, 50)}...`);
        const response = await fetch(videoUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Safety check for file size (Gemini inline limit ~20-30MB)
        if (arrayBuffer.byteLength > 20 * 1024 * 1024) {
            console.warn("[aiModel] Video too large for direct fetch (>20MB). Truncating might be needed.");
        }
        
        return Buffer.from(arrayBuffer).toString('base64');
    } catch (error) {
        console.error("Failed to fetch video data:", error.message);
        return null;
    }
};

/**
 * Multi-modal Video Analysis
 * Supports both local Base64 (inlineData) and YouTube/Public URLs (fileData)
 */
export const analyzeVideo = async ({ base64Video, videoUrl, mimeType, videoContext }) => {
    checkAiReadiness();
    
    try {
        const prompt = `
            Analyze this video content for fact-checking purposes.
            
            ${videoContext ? `CONTEXTUAL CLUE: The page hosting this video has the following title/text: "${videoContext}". Use this to help identify the subject even if the visual quality is low.` : ''}

            Requirements:
            1. Provide a concise summary of the spoken dialogue (avoiding word-for-word transcripts if long).
            2. Provide a concise summary of key visual events (actions, objects, text on screen).
            3. Create a "combined_context" which is a single, clear paragraph summarizing the core claim or event depicted in the video.
            4. Generate a concise "primary_query" (5-10 words) highlighting the specific factual claim for news search.
            
            STRICT ANTI-HALLUCINATION RULES:
            - You are analyzing a video via a URL (${videoUrl}). If you cannot access the video stream directly, DO NOT GUESS the content.
            - If the provided CONTEXTUAL CLUE clearly contradicts the identity of the Video URL (e.g., different subject matter), prioritize reporting the discrepancy.
            - Do NOT invent specific scientific or legal claims if the source is unavailable. If you are uncertain, use the 'combined_context' to express that the video could not be fully resolved visually.
            
            IMPORTANT: Ensure the response is a valid JSON object. Keep the total output concise to avoid truncation.
        `;

        const parts = [];
        
        // Add the analysis instructions
        parts.push({ text: prompt });

        // Input Type Handling
        if (videoUrl) {
            const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
            
            if (isYouTube) {
                console.log(`[aiModel] YouTube Link detected. Native Gemini video processing for external YT links is restricted.`);
                console.log(`[aiModel] Falling back to text-based context analysis for URL: ${videoUrl}`);
                // Instead of fileUri (which causes 403), we provide the URL and metadata context to the prompt
                parts.push({ text: `Analyze the claim presented in this YouTube video: ${videoUrl}\n\nNote: Visual stream is restricted. Use the URL and surrounding information for verification.` });
            } else {
                console.log(`[aiModel] Direct Video URL detected. Attempting download...`);
                const base64Data = await fetchVideoAsBase64(videoUrl);
                
                if (base64Data) {
                    parts.push({
                        inlineData: {
                            mimeType: mimeType || 'video/mp4',
                            data: base64Data
                        }
                    });
                } else {
                    console.warn("[aiModel] Could not download video. Proceeding with URL context only.");
                    parts.push({ text: `Verify claim for video at: ${videoUrl}` });
                }
            }
        } else if (base64Video) {
            console.log(`[aiModel] Analyzing Video from Base64 Data (size: ${Math.round(base64Video.length / 1024)} KB)`);
            parts.push({
                inlineData: {
                    mimeType: mimeType || 'video/mp4',
                    data: base64Video
                }
            });
        } else {
            throw new Error("Missing video input: Provide base64Video or videoUrl.");
        }

        const response = await executeWithRetry(() => client.models.generateContent({
            model: MODEL_NAME,
            contents: [{ parts: parts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING, description: "A concise summary of the entire video" },
                        transcription: { type: Type.STRING, description: "Summary or key segments of spoken dialogue" },
                        visual_summary: { type: Type.STRING, description: "Summary of key visual events/text" },
                        combined_context: { type: Type.STRING, description: "Unified claim extraction for search" },
                        primary_query: { type: Type.STRING, description: "Concise search string" }
                    },
                    required: ["summary", "transcription", "visual_summary", "combined_context", "primary_query"]
                }
            }
        }));

        console.log(`[aiModel] Received video analysis. Response length: ${response.text.length} chars.`);
        
        try {
            return JSON.parse(response.text);
        } catch (jsonError) {
            console.error("[aiModel] JSON Parse Error. Raw Response:", response.text.substring(0, 500) + "...");
            throw new Error("AI returned an invalid response format. The video might be too complex or long.");
        }
    } catch (error) {
        console.error("Gemini 3 Video Error:", error);
        if (error.details) console.error("Error Details:", JSON.stringify(error.details, null, 2));
        throw new Error(`Failed to analyze video: ${error.message || 'Check for file size or URL validity'}`);
    }
};



