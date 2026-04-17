const API_URL = "http://localhost:3000/api/fact-check"; // YOUR_BACKEND_URL
const cache = new Map();

let lastRequestTime = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkFact') {
        handleCheckFact(request.claim).then(sendResponse);
        return true; 
    }
    if (request.action === 'openDetailReport') {
        chrome.storage.local.set({ scrollSafeReport: request.data }, () => {
            chrome.tabs.create({ url: chrome.runtime.getURL("detail.html") });
        });
        sendResponse({ success: true });
        return true;
    }
});

async function handleCheckFact(claim, retries = 2) {
    if (cache.has(claim)) {
        return { data: cache.get(claim) };
    }

    const now = Date.now();
    if (now - lastRequestTime < 2000) {
        return { error: 'Rate limit: Please wait 2 seconds between requests.' };
    }
    lastRequestTime = now;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ claim })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        // Caching successful result
        cache.set(claim, data);
        return { data };

    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return handleCheckFact(claim, retries - 1);
        }
        return { error: error.message || 'Failed to connect to fact-checking API.' };
    }
}
