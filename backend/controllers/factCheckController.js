import { getEmbedding } from '../services/embeddingService.js';
import { fetchLiveNews } from '../services/newsService.js';
import { searchSimilarClaims } from '../models/qdrantModel.js';
import { evaluateClaim, checkAiReadiness, analyzeAudio, analyzeVideo } from '../models/aiModel.js';

import { fetchImageContext } from '../services/imageService.js';
import { extractLinkContext } from '../services/linkService.js';

export const processAudioFactCheck = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Audio file is required' });
        }
        console.log(`\n[POST /api/fact-check/audio] Received Audio Upload: ${req.file.mimetype}, size: ${req.file.size}`);
        
        const audioBuffer = req.file.buffer;
        const mimeType = req.file.mimetype;
        const base64Audio = audioBuffer.toString('base64');
        
        const audioAnalysis = await analyzeAudio(base64Audio, mimeType);
        const transcription = audioAnalysis.transcription;
        
        console.log(`[POST /api/fact-check/audio] Transcription: "${transcription}"`);
        console.log(`[POST /api/fact-check/audio] Authentic: ${audioAnalysis.is_authentic} | Reason: ${audioAnalysis.authenticity_reasoning}`);
        
        if (!transcription || transcription.trim().length === 0) {
            return res.status(400).json({ error: 'Could not transcribe any speech from the audio.' });
        }
        
        let claimWithContext = transcription;
        if (audioAnalysis.is_authentic === false) {
            claimWithContext += `\n\n[SYSTEM ALERT: This audio was detected as POTENTIALLY AI-GENERATED or DEEPFAKE. Reason: ${audioAnalysis.authenticity_reasoning}]`;
        }

        // Pass the transcription (with authenticity alert if needed) as the claim
        // and a refined search query to the next middleware
        req.body.claim = claimWithContext;
        req.body.newsQuery = audioAnalysis.primary_query;
        next();
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

export const processVideoFactCheck = async (req, res, next) => {
    try {
        const { videoUrl, videoContext } = req.body;
        let base64Video = null;
        let mimeType = null;

        if (req.file) {
            console.log(`\n[POST /api/fact-check/video] Received Video Upload: ${req.file.mimetype}, size: ${req.file.size}`);
            base64Video = req.file.buffer.toString('base64');
            mimeType = req.file.mimetype;
        } else if (videoUrl) {
            console.log(`\n[POST /api/fact-check/video] Received Video URL: ${videoUrl} | Metadata: ${videoContext || 'None'}`);
        } else {
            return res.status(400).json({ error: 'Video file or videoUrl is required' });
        }

        const videoAnalysis = await analyzeVideo({ base64Video, videoUrl, mimeType, videoContext });
        const context = videoAnalysis.combined_context;

        console.log(`[POST /api/fact-check/video] Context Extracted: "${context.substring(0, 100)}..."`);
        
        if (!context || context.trim().length === 0) {
            return res.status(400).json({ error: 'Could not identify the core claim or events in this video.' });
        }

        // Enrich the claim with transcription, visual notes, and metadata
        let enrichedClaim = `Video Content Summary: ${context}\n\nTranscription: ${videoAnalysis.transcription}\n\nVisuals: ${videoAnalysis.visual_summary}`;
        if (videoContext) {
            enrichedClaim = `On-Page Metadata (Title/Text): ${videoContext}\n\n${enrichedClaim}`;
        }
        
        req.body.claim = enrichedClaim;
        req.body.newsQuery = videoAnalysis.primary_query;
        next();
    } catch (e) {
        console.error("[processVideoFactCheck Error]", e);
        return res.status(500).json({ error: e.message });
    }
};



export const processFactCheck = async (req, res) => {
    try {
        let { claim, imageUrl, linkUrl } = req.body;
        
        let visualMatches = [];
        let newsQuery = claim; 
        let base64Image = null;

        if (req.file && req.file.mimetype.startsWith('image/')) {
            console.log(`\n[POST /api/fact-check] Received Image Upload: ${req.file.mimetype}`);
            base64Image = req.file.buffer.toString('base64');
            // When uploading a file, we skip fetchImageContext (SerpApi/Lens) as it requires a URL
            // and use Gemini vision directly on the base64 data.
            claim = claim || "Image Uploaded for Analysis";
            newsQuery = claim;
        } else if (imageUrl) {
            console.log(`\n[POST /api/fact-check] Received Image URL: ${imageUrl}`);
            try {
                const imgResult = await fetchImageContext(imageUrl);
                claim = imgResult.context;
                newsQuery = imgResult.primaryQuery;
                visualMatches = imgResult.visualMatches;
            } catch (e) {
                return res.status(400).json({ error: e.message });
            }
        } else if (linkUrl) {
            console.log(`\n[POST /api/fact-check] Received Link URL: ${linkUrl}`);
            try {
                claim = await extractLinkContext(linkUrl);
            } catch (e) {
                return res.status(400).json({ error: e.message });
            }
        } else if (req.body.newsQuery) {
            // Priority 1: Specifically extracted search query from Audio/Video
            newsQuery = req.body.newsQuery;
        } else if (!claim || claim.trim().length === 0) {
            return res.status(400).json({ error: 'Claim text, imageUrl, or linkUrl is required' });
        }

        try { checkAiReadiness(); } 
        catch (e) { return res.status(500).json({ error: e.message }); }

        console.log(`\n[POST /api/fact-check] Processing claim: "${claim.substring(0, 70)}..."`);

        // STEP 1: Fast Embedding natively
        let queryVector;
        try {
            queryVector = await getEmbedding(claim);
        } catch (e) {
            return res.status(503).json({ error: e.message });
        }

        // STEP 2: Database Hybrid Memory
        const qdrantResults = await searchSimilarClaims(queryVector);

        let contextBlock = "EVIDENCE FROM QDRANT (DATABASE):\n\n";
        let topScore = 0;
        let sourceQdrant = []; 

        if (qdrantResults.length === 0) {
             contextBlock += "[No similar claims found in database]\n";
        } else {
             topScore = qdrantResults[0].score;
             qdrantResults.forEach((match, index) => {
                 sourceQdrant.push({
                     score: match.score,
                     label: match.payload.label,
                     claim: match.payload.claim,
                     fact_checkers: match.payload.fact_checkers,
                     explanation: match.payload.explanation
                 });
                 contextBlock += `--- Match ${index + 1} (Similarity: ${(match.score * 100).toFixed(1)}%) ---\n`;
                 contextBlock += `Label (Truth): ${match.payload.label}\n`;
                 contextBlock += `Claim: ${match.payload.claim}\n`;
                 contextBlock += `Fact Checkers: ${match.payload.fact_checkers}\n`;
                 contextBlock += `Verified Explanation: ${match.payload.explanation}\n\n`;
             });
        }

        // STEP 2B: Live News Fallback Check
        let liveNewsBlock = "RECENT NEWS REPORTS (LIVE WEB WEB-SEARCH):\n\n";
        let sourceNews = []; 
        
        if (topScore < 0.85) {
             const articles = await fetchLiveNews(newsQuery || claim);
             if (articles && articles.length > 0) {
                 let flatNews = [];
                 articles.forEach(a => {
                     if (a.stories) flatNews.push(...a.stories);
                     else flatNews.push(a);
                 });
                 
                 const bestArticles = flatNews.slice(0, 10);
                 bestArticles.forEach((article, index) => {
                     sourceNews.push({
                         title: article.title,
                         source: article.source?.name || 'News Source',
                         date: article.date || 'Recent',
                         snippet: article.snippet || null,
                         link: article.link || '#'
                     });
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

        // STEP 3: Prompt Configuration
        const prompt = `
You are ScrollSafe, a highly intelligent and professional fact-checking AI.
Your job is to analyze the user's incoming claim, compare it strictly against BOTH the provided historical database records AND the live news articles.

Rule 1: Treat database similarity scores mathematically. If similarity is > 80%, consider the historical claim extremely strong evidence.
Rule 2: Cross-check against the breaking news! Does the Live News contradict the historical database? If so, real-world live events take priority!
Rule 3: NEVER mention internal tools or systems by name in your explanation. Do NOT mention "Qdrant", "database matches", "similarity scores", "Google News", or "SerpApi". Speak directly to the user as ScrollSafe.
Rule 4: Keep the explanation concise, empathetic, and direct. Explain *why* it is true or false using the real-world facts provided, not the mechanisms used to find them.
Rule 5: Output seamlessly resolving the JSON schema constraint.
Rule 6: MEDIA SOURCE IDENTIFICATION: If the provided Context (especially "Image Analysis Extracted Context") includes specific match articles with source names (e.g., "The Indian Express"), your explanation MUST start by identifying where this media originated from (e.g., "This image belongs to a report from The Indian Express regarding..."). Then proceed with the fact-check.

USER CLAIM TO EVALUATE:
"${claim}"

${contextBlock}
${liveNewsBlock}
`;

        // STEP 4: Execution
        console.log("-> Pitching to Gemini for Final Decision (Vision + Context)...");
        const finalDecisionJson = await evaluateClaim(prompt, imageUrl, base64Image);
        console.log("<- Verdict Result:", finalDecisionJson.verdict);

        // STEP 5: Response Emittance
        res.json({
            claim: claim,
            verdict: finalDecisionJson.verdict.toUpperCase(),
            confidence: finalDecisionJson.confidence,
            explanation: finalDecisionJson.explanation,
            score: topScore.toFixed(4),
            sources: {
                qdrant: sourceQdrant,
                news: sourceNews
            },
            visualMatches: visualMatches,
            googleContext: imageUrl ? claim.replace("Image Analysis Extracted Context: ", "") : null 
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error during fact checking.' });
    }
};
