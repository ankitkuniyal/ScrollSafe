export const fetchLiveNews = async (query) => {
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
};
