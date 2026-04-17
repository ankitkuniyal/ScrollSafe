export const extractLinkContext = async (linkUrl) => {
    try {
        console.log(`... Extracting metadata from link: ${linkUrl} ...`);
        
        const response = await fetch(linkUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch the URL: ${response.statusText}`);
        }
        
        const html = await response.text();
        
        // Extract title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : 'No Title';
        
        // Extract meta description
        const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) || 
                          html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
        const description = descMatch ? descMatch[1].trim() : '';

        // Extract H1 as fallback or addition
        const h1Match = html.match(/<h1>(.*?)<\/h1>/i);
        const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '';

        const context = `Headline: ${title}. Key Summary: ${description}. Main Topic: ${h1}`;
        
        console.log(`✅ Extracted context from link: "${context.substring(0, 80)}..."`);
        return context;
        
    } catch (error) {
        console.error("Link Extraction Failed:", error);
        throw new Error(`Could not extract information from that link. Error: ${error.message}`);
    }
};
