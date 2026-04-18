import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '../backend/.env' });

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ''
});

async function testGemini() {
    try {
        const model = "gemini-1.5-flash"; // testing with a known stable model
        const response = await client.models.generateContent({
            model: model,
            contents: [{ parts: [{ text: "Hello, are you working?" }] }]
        });
        console.log("Success:", response.text);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.details) console.error("Details:", JSON.stringify(error.details, null, 2));
    }
}

testGemini();
