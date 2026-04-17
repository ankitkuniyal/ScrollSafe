import dotenv from 'dotenv';
dotenv.config();

const imageUrl = 'https://images.indianexpress.com/2026/04/women_2e924c.jpg?w=1600';

async function testLens() {
    try {
        const url = new URL('https://serpapi.com/search.json');
        url.searchParams.append('engine', 'google_lens');
        url.searchParams.append('url', imageUrl);
        url.searchParams.append('api_key', process.env.SERPAPI_API_KEY);
        
        const res = await fetch(url.toString());
        const data = await res.json();
        
        console.log("VISUAL MATCHES:");
        if (data.visual_matches) {
            data.visual_matches.slice(0, 3).forEach((v, i) => {
                console.log(`-- match ${i} --`);
                console.log(`title: ${v.title}`);
                console.log(`source: ${v.source}`);
                console.log(`link: ${v.link}`);
            });
        }
    } catch (e) {
        console.error(e);
    }
}

testLens();
