import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { QdrantClient } from '@qdrant/js-client-rest';
import { pipeline } from '@xenova/transformers';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize env vars from .env file
dotenv.config();

const app = express();
app.use(cors()); // Allow requests from any origin (e.g. the browser extension)
app.use(express.json()); // Parse incoming JSON request bodies

const client = new QdrantClient({
    url: 'https://b17341c0-cbf6-460b-a452-bb065549b65f.eu-west-2-0.aws.cloud.qdrant.io:6333',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIiwic3ViamVjdCI6ImFwaS1rZXk6Y2QxYTllNTgtNjc2OC00NWI4LWJkNWItMDlmZjhjNGFkZDlhIn0.BhvkbvyYxi8SLSE--QyHbu5TcxMs2OEsAvC452u1o8k',
});
const COLLECTION_NAME = 'scrollsafe_claims';

// Initialize Gemini Brain
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
if (!genAI){ console.log("No Gemini API key")} else console.log("Detected")

// Define structured JSON schema so Gemini ALWAYS returns the perfect format for our extension UI
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: {
      type: SchemaType.STRING,
      description: "Must be TRUE, FALSE, MISLEADING, or UNCERTAIN",
    },
    confidence: {
      type: SchemaType.STRING,
      description: "Must be HIGH, MEDIUM, or LOW",
    },
    explanation: {
      type: SchemaType.STRING,
      description: "A nuanced, empathetic explanation summarizing the context and the model reasoning (max 2 sentences).",
    },
  },
  required: ["verdict", "confidence", "explanation"],
};

// Hook up the requested hackathon model: gemini-2.5-flash-lite
const aiModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
    }
});

// Pre-load the local embedding AI model
let generateEmbedding = null;
pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    .then(model => {
        generateEmbedding = model;
        console.log('✅ Local Embedding model ready!');
    })
    .catch(err => {
        console.error('❌ Failed to load embedding model:', err);
    });

app.get("/", (req, res) => {
    res.send("Welcome to ScrollSafe Backend API");
});

/**
 * Helper function to fetch live breaking news
 */
async function fetchLiveNews(query) {
    if (!process.env.SERPAPI_API_KEY || process.env.SERPAPI_API_KEY.includes('your_')) {
        console.warn("⚠️ SERPAPI_API_KEY is not configured! Skipping live news verification.");
        return null;
    }
    try {
        console.log("... Triggering LIVE NEWS verification against SerpApi ...");
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.append('engine', 'google_news');
        url.searchParams.append('q', query);
        url.searchParams.append('api_key', process.env.SERPAPI_API_KEY);
        
        const res = await fetch(url.toString());
        if (!res.ok) {
             throw new Error(`SerpApi returned ${res.status}`);
        }
        const data = await res.json();
        return data.news_results || [];
    } catch (error) {
        console.error("News API Failed:", error);
        return null;
    }
}

/**
 * POST /api/fact-check
 */
app.post('/api/fact-check', async (req, res) => {
    try {
        const { claim } = req.body;
        
        if (!claim || claim.trim().length === 0) {
            return res.status(400).json({ error: 'Claim text is required' });
        }

        if (!generateEmbedding) {
            return res.status(503).json({ error: 'AI model is still loading, please try again in a moment.' });
        }

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('your_')) {
            console.error("FATAL: GEMINI_API_KEY is not configured in .env");
            return res.status(500).json({ error: 'Server misconfigured: Missing Gemini API Key.' });
        }

        console.log(`\n[POST /api/fact-check] Processing claim: "${claim.substring(0, 70)}..."`);

        // STEP 1: SIGNAL - Generate text embeddings natively
        const output = await generateEmbedding(claim, { pooling: 'mean', normalize: true });
        const queryVector = Array.from(output.data);

        // STEP 2: HYBRID MEMORY - Retrieve top 3 contextual pieces of evidence from Qdrant
        const qdrantResults = await client.search(COLLECTION_NAME, {
            vector: queryVector,
            limit: 3, 
            with_payload: true, 
        });

        // Structure the Qdrant Context Array for LLM ingestion
        let contextBlock = "EVIDENCE FROM QDRANT (DATABASE):\n\n";
        let topScore = 0;
        if (qdrantResults.length === 0) {
             contextBlock += "[No similar claims found in database]\n";
        } else {
             topScore = qdrantResults[0].score;
             qdrantResults.forEach((match, index) => {
                 contextBlock += `--- Match ${index + 1} (Similarity: ${(match.score * 100).toFixed(1)}%) ---\n`;
                 contextBlock += `Label (Truth): ${match.payload.label}\n`;
                 contextBlock += `Claim: ${match.payload.claim}\n`;
                 contextBlock += `Fact Checkers: ${match.payload.fact_checkers}\n`;
                 contextBlock += `Verified Explanation: ${match.payload.explanation}\n\n`;
             });
        }

        // STEP 2B: LIVE REAL-WORLD NEWS (If memory is not confident, check real-world live events)
        let liveNewsBlock = "RECENT NEWS REPORTS (LIVE WEB WEB-SEARCH):\n\n";
        if (topScore < 0.85) {
             const articles = await fetchLiveNews(claim);
             if (articles && articles.length > 0) {
                 // The JSON can sometimes group articles into a 'stories' array
                 let flatNews = [];
                 articles.forEach(a => {
                     if (a.stories) flatNews.push(...a.stories);
                     else flatNews.push(a);
                 });
                 
                 const bestArticles = flatNews.slice(0, 5); // Grab top 5 freshest headlines
                 bestArticles.forEach((article, index) => {
                     liveNewsBlock += `--- Article ${index + 1} from ${article.source?.name || 'News Source'} ---\n`;
                     liveNewsBlock += `Title: ${article.title}\n`;
                     liveNewsBlock += `Date: ${article.date || 'Recent'}\n`;
                     if (article.snippet) liveNewsBlock += `Summary: ${article.snippet}\n`;
                     liveNewsBlock += `\n`;
                 });
             } else {
                 liveNewsBlock += "[No breaking news found or Live API offline.]\n";
             }
        } else {
             liveNewsBlock += "[Skipped live news search because database match was >85% identical.]\n";
        }

        // STEP 3: DECISION LAYER - Combine the User's query with Context and pipe to Gemini
        const prompt = `
You are ScrollSafe, a highly intelligent and professional fact-checking AI.
Your job is to analyze the user's incoming claim, compare it strictly against BOTH the provided historical database records AND the live news articles.

Rule 1: Treat database similarity scores mathematically. If similarity is > 80%, consider the historical claim extremely strong evidence.
Rule 2: Cross-check against the breaking news! Does the Live News contradict the historical database? If so, real-world live events take priority!
Rule 3: NEVER mention internal tools or systems by name in your explanation. Do NOT mention "Qdrant", "database matches", "similarity scores", "Google News", or "SerpApi". Speak directly to the user as ScrollSafe.
Rule 4: Keep the explanation concise, empathetic, and direct. Explain *why* it is true or false using the real-world facts provided, not the mechanisms used to find them.
Rule 5: Output seamlessly resolving the JSON schema constraint.

USER CLAIM TO EVALUATE:
"${claim}"

${contextBlock}
${liveNewsBlock}
`;

        // STEP 4: FINAL VERDICT - Let the LLM weigh the evidence!
        console.log("-> Pitching to Gemini for Final Decision...");
        
        console.log("\n=================== PROMPT TO GEMINI ===================");
        console.log(prompt);
        console.log("========================================================\n");
        
        const aiResponse = await aiModel.generateContent(prompt);
        const finalDecisionJson = JSON.parse(aiResponse.response.text());

        console.log("<- Verdict Result:", finalDecisionJson.verdict);
        
        console.log("\n================ GEMINI RAW RESPONSE ================");
        console.log(JSON.stringify(finalDecisionJson, null, 2));
        console.log("=====================================================\n");

        // STEP 5: Emit the dynamically reasoned response identically down to the Extension
        res.json({
            verdict: finalDecisionJson.verdict.toUpperCase(),
            confidence: finalDecisionJson.confidence.charAt(0).toUpperCase() + finalDecisionJson.confidence.slice(1).toLowerCase(),
            explanation: finalDecisionJson.explanation,
            score: topScore.toFixed(4)
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error during fact checking.' });
    }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ScrollSafe Backend API is running on http://localhost:${PORT}`);
});
