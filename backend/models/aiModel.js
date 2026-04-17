import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

// Create the Gen-3 Gemini Client via the new SDK
const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

// Current model configuration
const MODEL_NAME = "gemini-3-flash-preview";

// JSON Schema for structured fact-checking output
const responseSchema = {
    type: "OBJECT",
    properties: {
        verdict: {
            type: "STRING",
            description: "Must be TRUE, FALSE, or UNCERTAIN",
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

export const evaluateClaim = async (prompt, imageUrl = null, base64ImageInput = null) => {
    checkAiReadiness();
    
    try {
        let contents = [];
        let finalBase64 = base64ImageInput;

        // If no direct base64 provided but we have a URL, fetch it
        if (!finalBase64 && imageUrl) {
            finalBase64 = await fetchImageAsBase64(imageUrl);
        }

        // Add multimodal image part if we have base64 data
        if (finalBase64) {
            contents.push({
                inlineData: {
                    mimeType: "image/jpeg", 
                    data: finalBase64
                }
            });
        }

        // Add text prompt
        contents.push({ text: prompt });

        console.log("---------------- GEMINI PROMPT ----------------");
        console.log(prompt); 
        if (imageUrl || base64ImageInput) console.log(`[Vision Enabled with ${imageUrl ? 'URL' : 'Local Upload'}]`);
        console.log("-----------------------------------------------");

        // Build config conditionally
        const config = {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        };

        // Enable Thinking Mode only for gemini-3-flash-preview
        if (MODEL_NAME === "gemini-3-flash-preview") {
            config.thinkingConfig = {
                thinkingLevel: ThinkingLevel.LOW,
            };
        }

        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: contents,
            config: config
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
            4. Generate a concise "primary_query" (5-8 words) that captures the core factual claim for search engine verification.
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
            model: MODEL_NAME,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        transcription: { type: "STRING", description: "The transcribed text of the audio" },
                        is_authentic: { type: "BOOLEAN", description: "True if the audio appears naturally human-recorded, False if it shows signs of AI generation or tampering" },
                        authenticity_reasoning: { type: "STRING", description: "Brief reasoning for why it was deemed authentic or synthetic" },
                        primary_query: { type: "STRING", description: "Most concise search query for news verification" }
                    },
                    required: ["transcription", "is_authentic", "authenticity_reasoning", "primary_query"]
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

        let contents = [];
        
        // Input Type Handling
        if (videoUrl) {
            const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
            
            if (isYouTube) {
                console.log(`[aiModel] YouTube Link detected. Native Gemini video processing for external YT links is restricted.`);
                console.log(`[aiModel] Falling back to text-based context analysis for URL: ${videoUrl}`);
                // Instead of fileUri (which causes 403), we provide the URL and metadata context to the prompt
                contents.push({ text: `Analyze the claim presented in this YouTube video: ${videoUrl}\n\nNote: Visual stream is restricted. Use the URL and surrounding information for verification.` });
            } else {
                console.log(`[aiModel] Direct Video URL detected. Attempting download...`);
                const base64Data = await fetchVideoAsBase64(videoUrl);
                
                if (base64Data) {
                    contents.push({
                        inlineData: {
                            mimeType: mimeType || 'video/mp4',
                            data: base64Data
                        }
                    });
                } else {
                    console.warn("[aiModel] Could not download video. Proceeding with URL context only.");
                    contents.push({ text: `Verify claim for video at: ${videoUrl}` });
                }
            }
        } else if (base64Video) {
            console.log(`[aiModel] Analyzing Video from Base64 Data (size: ${Math.round(base64Video.length / 1024)} KB)`);
            contents.push({
                inlineData: {
                    mimeType: mimeType || 'video/mp4',
                    data: base64Video
                }
            });
        } else {
            throw new Error("Missing video input: Provide base64Video or videoUrl.");
        }

        // Add the analysis instructions
        contents.push({ text: prompt });

        const response = await client.models.generateContent({
            model: MODEL_NAME,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        transcription: { type: "STRING" },
                        visual_summary: { type: "STRING" },
                        combined_context: { type: "STRING", description: "The unified claim extraction for search" },
                        primary_query: { type: "STRING", description: "Concise search string for Google News" }
                    },
                    required: ["transcription", "visual_summary", "combined_context", "primary_query"]
                }
            }
        });

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



