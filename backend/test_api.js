import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

async function testGemini() {
    try {
        const model = "gemini-1.5-flash"; 
        const response = await client.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: "Hello, are you working?" }] }]
        });
        console.log("Success:", response.text);
    } catch (error) {
        console.error("Error Message:", error.message);
        // Special check for quota/auth 
        if (error.message.includes("quota") || error.message.includes("429")) {
            console.error("Diagnosis: You have exceeded your API quota.");
        }
    }
}

testGemini();
