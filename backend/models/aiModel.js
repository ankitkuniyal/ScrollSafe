import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: {
      type: SchemaType.STRING,
      description: "Must be TRUE, FALSE, MISLEADING, or UNCERTAIN",
    },
    confidence: {
      type: SchemaType.INTEGER,
      description: "A numerical percentage from 0 to 100 representing how confident you are in your verdict.",
    },
    explanation: {
      type: SchemaType.STRING,
      description: "A nuanced, empathetic explanation summarizing the context and the model reasoning (max 2 sentences).",
    },
  },
  required: ["verdict", "confidence", "explanation"],
};

const aiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
});

export const checkAiReadiness = () => {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
        throw new Error("GEMINI_API_KEY is not configured in .env");
    }
};

export const evaluateClaim = async (prompt) => {
    const aiResponse = await aiModel.generateContent(prompt);
    return JSON.parse(aiResponse.response.text());
};
