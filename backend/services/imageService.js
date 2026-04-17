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
        
        // Try to extract highly relevant visual matches
        if (data.visual_matches && data.visual_matches.length > 0) {
            // Aggregate the top 4 visual match titles to form a comprehensive contextual string
            context = data.visual_matches.slice(0, 4).map(v => v.title).join(". ");
        } 
        else if (data.knowledge_graph && data.knowledge_graph.length > 0) {
            context = data.knowledge_graph.map(k => k.title).join(". ");
        }

        if (!context || context.trim().length === 0) {
            throw new Error("Google Lens could not map this image to real-world context.");
        }

        console.log(`✅ Extracted core context from image: "${context.substring(0, 60)}..."`);
        return `Image Analysis Extracted Context: ${context}`;
        
    } catch (error) {
        console.error("Image Service Failed:", error);
        throw error; 
    }
};
