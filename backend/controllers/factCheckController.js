import { getEmbedding } from '../services/embeddingService.js';
import { fetchLiveNews } from '../services/newsService.js';
import { searchSimilarClaims } from '../models/qdrantModel.js';
import { evaluateClaim, checkAiReadiness } from '../models/aiModel.js';

export const processFactCheck = async (req, res) => {
    try {
        const { claim } = req.body;
        
        if (!claim || claim.trim().length === 0) {
            return res.status(400).json({ error: 'Claim text is required' });
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
             const articles = await fetchLiveNews(claim);
             if (articles && articles.length > 0) {
                 let flatNews = [];
                 articles.forEach(a => {
                     if (a.stories) flatNews.push(...a.stories);
                     else flatNews.push(a);
                 });
                 
                 const bestArticles = flatNews.slice(0, 5);
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

USER CLAIM TO EVALUATE:
"${claim}"

${contextBlock}
${liveNewsBlock}
`;

        // STEP 4: Execution
        console.log("-> Pitching to Gemini for Final Decision...");
        const finalDecisionJson = await evaluateClaim(prompt);
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
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal server error during fact checking.' });
    }
};
