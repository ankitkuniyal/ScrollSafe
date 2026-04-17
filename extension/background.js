const API_URL = "http://localhost:3000/api/fact-check"; // YOUR_BACKEND_URL
const cache = new Map();

let lastRequestTime = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkFact') {
        handleCheckFact(request.claim, request.imageUrl)
            .then(sendResponse)
            .catch(err => sendResponse({ error: err.message }));
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
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "checkImage",
        title: "Analyze Image with ScrollSafe",
        contexts: ["image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkImage" && info.srcUrl) {
        chrome.tabs.sendMessage(tab.id, {
            action: 'triggerImageCheck',
            imageUrl: info.srcUrl
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn("Could not send checkImage message (Receiving end does not exist). The user likely needs to refresh the page.");
            }
        });
    }
});

async function handleCheckFact(claim, imageUrl, retries = 2) {
    const cacheKey = imageUrl || claim;
    if (cache.has(cacheKey)) {
        return { data: cache.get(cacheKey) };
    }

    const now = Date.now();
    if (now - lastRequestTime < 2000) {
        return { error: 'Rate limit: Please wait 2 seconds between requests.' };
    }
    lastRequestTime = now;

    try {
        const payload = imageUrl ? { imageUrl } : { claim };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        
        cache.set(cacheKey, data);
        return { data };

    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return handleCheckFact(claim, imageUrl, retries - 1);
        }
        return { error: error.message || 'Failed to connect to fact-checking API.' };
    }
}
