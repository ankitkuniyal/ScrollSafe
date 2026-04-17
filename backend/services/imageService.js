export const fetchImageContext = async (imageUrl) => {
    if (!process.env.SERPAPI_API_KEY || process.env.SERPAPI_API_KEY.includes('your_')) {
        throw new Error("SERPAPI_API_KEY is missing. Cannot verify images.");
    }
    try {
        console.log(`... Analyzing Image via Google Lens: ${imageUrl} ...`);
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.append('engine', 'google_lens');
        url.searchParams.append('url', imageUrl);
        url.searchParams.append('api_key', process.env.SERPAPI_API_KEY);
        
        const res = await fetch(url.toString());
        if (!res.ok) {
             throw new Error(`Google Lens API returned ${res.status}`);
        }
        
        const data = await res.json();
        let context = "";
        
        // Try to extract highly relevant visual matches with rich metadata
        if (data.visual_matches && data.visual_matches.length > 0) {
            // Aggregate the top 5 visual matches with complete attribution metadata
            context = data.visual_matches.slice(0, 5).map((v, i) => 
                `Match ${i+1}: "${v.title}" (Source: ${v.source || 'Unknown Source'}, Link: ${v.link})`
            ).join("\n");
        } 
        else if (data.knowledge_graph && data.knowledge_graph.length > 0) {
            context = data.knowledge_graph.map(k => `${k.title}: ${k.description || ''}`).join(". ");
        }

        if (!context || context.trim().length === 0) {
            throw new Error("Google Lens could not map this image to real-world context.");
        }

        console.log(`✅ Extracted core context from image: "${context.substring(0, 60)}..."`);
        
        // Pick a smart query for news search (Skip stock photos, pick headlines)
        const junkKeywords = ["stock", "photo", "istock", "shutterstock", "alamy", "getty", "290+", "buy", "price", "premium"];
        const matches = data.visual_matches || [];
        const bestMatch = matches.slice(0, 5).find(m => {
            const title = m.title.toLowerCase();
            return !junkKeywords.some(key => title.includes(key));
        });
        const smartQuery = (bestMatch ? bestMatch.title : (matches[0]?.title || context)).split('...')[0].trim();

        return {
            context: `Image Analysis Extracted Context: ${context}`,
            primaryQuery: smartQuery,
            visualMatches: matches.slice(0, 8) // Return top 8 matches for the gallery
        };
        
    } catch (error) {
        console.error("Image Service Failed:", error);
        throw error; 
    }
};
