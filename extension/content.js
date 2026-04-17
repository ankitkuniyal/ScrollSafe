let currentBtn = null;
let currentCard = null;
let isAnalyzingVideo = false;

function removeUI() {
    if (currentBtn) {
        currentBtn.remove();
        currentBtn = null;
    }
    if (currentCard) {
        currentCard.remove();
        currentCard = null;
    }
    hideGlobalLoader();
}

function showGlobalLoader() {
    if (document.getElementById('scrollsafe-top-loader')) return;
    const loader = document.createElement('div');
    loader.id = 'scrollsafe-top-loader';
    document.body.appendChild(loader);
}

function hideGlobalLoader() {
    const loader = document.getElementById('scrollsafe-top-loader');
    if (loader) loader.remove();
}

function preprocessText(text) {
    let clean = text.replace(/\s+/g, ' ').trim();
    const match = clean.match(/[^.!?]+[.!?]+/);
    const mainClaim = match ? match[0] : clean;
    return mainClaim.substring(0, 300).toLowerCase();
}

document.addEventListener('mouseup', (e) => {
    // Check if the extension context is still valid
    if (!chrome.runtime?.id) return;

    chrome.storage.local.get(['isEnabled'], (result) => {
        if (chrome.runtime.lastError || result.isEnabled === false) return;

        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection.toString();

            if (currentCard && currentCard.contains(e.target)) return;
            if (currentBtn && currentBtn.contains(e.target)) return;

            removeUI();

            if (text.length > 20) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();

                const btn = document.createElement('button');
                btn.id = 'scrollsafe-btn';
                btn.innerHTML = `
                    <span>Check with ScrollSafe</span>
                    <svg width="18" height="14" viewBox="0 0 59 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 15.1533L56.0254 27.3643C57.7788 27.8295 59 29.4164 59 31.2305V40H49V35.8457L29.501 30.6729L10 35.8457V40H0V31.2305C4.53996e-06 29.4164 1.22118 27.8295 2.97461 27.3643L10.001 25.499L2.97461 23.6357C1.22116 23.1706 3.02567e-05 21.5836 0 19.7695V14C0 11.7909 1.79086 10 4 10H10V15.1533Z" fill="white"/>
                        <path d="M55 10C57.2091 10 59 11.7909 59 14V20H49V10H55Z" fill="white"/>
                        <path d="M45 0C47.2091 0 49 1.79086 49 4V10H10V4C10 1.79086 11.7909 2.81866e-08 14 0H45Z" fill="white"/>
                    </svg>
                `;
                // Position relative to document
                btn.style.top = `${rect.bottom + window.scrollY + 8}px`;
                btn.style.left = `${rect.left + window.scrollX}px`;

                btn.addEventListener('mousedown', async (ev) => {
                    ev.preventDefault(); // maintain selection highlighting
                    ev.stopPropagation();

                    const processed = preprocessText(text);
                    if (currentBtn) currentBtn.remove();
                    currentBtn = null;

                    showLoadingCard(rect.bottom + window.scrollY + 8, rect.left + window.scrollX, "Analyzing Claim...");
                    showGlobalLoader();

                    try {
                        const response = await chrome.runtime.sendMessage({
                            action: 'checkFact',
                            claim: processed
                        });

                        if (response.error) {
                            showErrorCard(response.error, rect.bottom + window.scrollY + 8, rect.left + window.scrollX);
                        } else {
                            showResultCard(response.data, rect.bottom + window.scrollY + 8, rect.left + window.scrollX);
                        }
                    } catch (error) {
                        showErrorCard(`Extension error: ${error.message || 'Could not contact background script.'}`, rect.bottom + window.scrollY + 8, rect.left + window.scrollX);
                    }
                });

                document.body.appendChild(btn);
                currentBtn = btn;
            }
        }, 10);
    });
});

document.addEventListener('mousedown', (e) => {
    if (currentBtn && !currentBtn.contains(e.target) && (!currentCard || !currentCard.contains(e.target))) {
        removeUI();
    }
});

function createBaseCard(top, left) {
    if (currentCard) currentCard.remove();
    const card = document.createElement('div');
    card.id = 'scrollsafe-card';
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;

    // Attempt graceful placement offscreen collision detection
    if (left + 320 > window.innerWidth) {
        card.style.left = `${window.innerWidth - 340}px`;
    }

    return card;
}

function showLoadingCard(top, left, message = "Analyzing with ScrollSafe...") {
    const card = createBaseCard(top, left);
    card.innerHTML = `
        <div id="scrollsafe-loader">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            ${message}
        </div>
    `;
    document.body.appendChild(card);
    currentCard = card;
}

function showResultCard(data, top, left) {
    const card = createBaseCard(top, left);
    const verdict = data.verdict?.toLowerCase() || 'uncertain';

    let iconSvg = '';
    let headerLabel = '';

    if (verdict === 'false') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        headerLabel = 'FALSE CLAIM DETECTED';
    } else if (verdict === 'true') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        headerLabel = 'VERIFIED TRUE';
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        headerLabel = 'UNCERTAIN VERDICT';
    }

    card.innerHTML = `
        <div class="scrollsafe-header header-${verdict}">
            <div class="scrollsafe-header-content">
                ${iconSvg}
                <span>${headerLabel}</span>
            </div>
            <button class="close-btn">&times;</button>
        </div>
        <div class="scrollsafe-body">
            ${data.explanation || 'No further explanation provided by the fact-checking API.'}
        </div>
        <div class="scrollsafe-footer">
            <div class="scrollsafe-confidence">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Confidence: ${data.confidence !== undefined ? `${data.confidence}%` : 'Medium'}
            </div>
            <button class="scrollsafe-read-more detail-btn">Read Full Report</button>
        </div>
    `;

    card.querySelector('.close-btn').addEventListener('click', () => {
        card.remove();
        currentCard = null;
    });

    card.querySelector('.detail-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({
            action: 'openDetailReport',
            data: data
        });
    });

    document.body.appendChild(card);
    currentCard = card;
}

function showErrorCard(errorMsg, top, left) {
    const card = createBaseCard(top, left);
    card.innerHTML = `
        <div class="scrollsafe-header header-uncertain">
            <span>ERROR</span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="scrollsafe-body" style="color: #dc2626">
            ${errorMsg}
        </div>
    `;

    card.querySelector('.close-btn').addEventListener('click', () => {
        card.remove();
        currentCard = null;
    });

    document.body.appendChild(card);
    currentCard = card;
}

/**
 * Multimodal UI: Floating Video Buttons
 */
function injectVideoButtons() {
    const isYouTube = window.location.hostname.includes('youtube.com');

    if (isYouTube) {
        // 1. YouTube Regular (Action Bar integration)
        // Target modern ytd-watch-metadata buttons or fallback to legacy ytd-video-primary-info-renderer
        const actionBarSelectors = [
            'ytd-watch-metadata #top-level-buttons-computed',
            '#top-level-buttons-computed.ytd-menu-renderer',
            'ytd-video-primary-info-renderer #top-level-buttons-computed'
        ];

        let barFound = false;
        actionBarSelectors.forEach(selector => {
            const bars = document.querySelectorAll(`${selector}:not(.scrollsafe-injected)`);
            bars.forEach(bar => {
                bar.classList.add('scrollsafe-injected');
                addYTActionBarBtn(bar, () => window.location.href);
                barFound = true;
            });
        });

        // 2. YouTube Shorts (Action Tray integration)
        const ytShortsTrays = document.querySelectorAll('reel-action-bar-view-model:not(.scrollsafe-injected)');
        ytShortsTrays.forEach(tray => {
            tray.classList.add('scrollsafe-injected');
            addShortsTrayBtn(tray, () => window.location.href);
        });
    } else {
        // 3. X (Twitter) and other supported sites (Floating Button)
        const videos = document.querySelectorAll('video:not(.scrollsafe-injected)');
        videos.forEach(v => {
            v.classList.add('scrollsafe-injected');
            const isX = window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');
            const container = isX ? (v.closest('div[data-testid="videoPlayer"]') || v.parentElement) : v.parentElement;
            addFloatingBtn(container, () => v.src || window.location.href, isX);
        });
    }
}

function addYTActionBarBtn(container, getUrlFunc) {
    const btnViewModel = document.createElement('button-view-model');
    btnViewModel.className = 'ytSpecButtonViewModelHost style-scope ytd-menu-renderer scrollsafe-yt-action-item';

    btnViewModel.innerHTML = `
        <button class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-only" aria-label="Analyze">
            <div aria-hidden="true" class="yt-spec-button-shape-next__icon">
                <svg id="scrollsafe-shorts-icon" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="3" style="width: 20px; height: 20px;">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            </div>
            <yt-touch-feedback-shape aria-hidden="true" class="ytSpecTouchFeedbackShapeHost ytSpecTouchFeedbackShapeTouchResponse">
                <div class="ytSpecTouchFeedbackShapeStroke"></div>
                <div class="ytSpecTouchFeedbackShapeFill"></div>
            </yt-touch-feedback-shape>
        </button>
    `;

    btnViewModel.querySelector('button').addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (isAnalyzingVideo) return;
        isAnalyzingVideo = true;

        btnViewModel.classList.add('loading');
        const videoUrl = getUrlFunc();
        const top = window.scrollY + 100;
        const left = window.scrollX + (window.innerWidth / 2) - 190;

        // Extract Title relative to the action bar to avoid mismatch
        const watchMetadata = btnViewModel.closest('ytd-watch-metadata, #watch-header, ytd-video-primary-info-renderer');
        const videoTitle = watchMetadata?.querySelector('h1')?.innerText || document.title;

        removeUI();
        showLoadingCard(top, left, "Analyzing Video Content...");
        showGlobalLoader();

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'checkVideoFact',
                videoUrl: videoUrl,
                context: videoTitle
            });

            isAnalyzingVideo = false;
            btnViewModel.classList.remove('loading');

            if (response.error) {
                showErrorCard(response.error, top, left);
            } else {
                showResultCard(response.data, top, left);
            }
        } catch (err) {
            isAnalyzingVideo = false;
            btnViewModel.classList.remove('loading');
            showErrorCard(`Extension error: ${err.message || 'Analysis failed.'}`, top, left);
        }
    });

    container.appendChild(btnViewModel);
}


function addShortsTrayBtn(tray, getUrlFunc) {
    const label = document.createElement('label');
    label.className = 'ytSpecButtonShapeWithLabelHost scrollsafe-shorts-tray-item';
    label.innerHTML = `
        <button class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-l yt-spec-button-shape-next--icon-button">
            <div aria-hidden="true" class="yt-spec-button-shape-next__icon">
                <svg id="scrollsafe-shorts-icon" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" style="width: 24px; height: 24px;">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
            </div>
        </button>
        <span class="scrollsafe-shorts-label" style="font-size: 12px !important; font-weight: 600 !important; color: white !important; margin-top: 8px !important;">Analyzing...</span>
    `;

    label.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (isAnalyzingVideo) return;
        isAnalyzingVideo = true;

        label.classList.add('loading');

        // Extract ID and Title relative to the current reel container
        const reel = label.closest('ytd-reel-video-renderer, reel-video-display-view-model-v2');
        const videoId = reel?.getAttribute('video-id');
        const videoUrl = videoId ? `https://www.youtube.com/shorts/${videoId}` : window.location.href;

        const rect = label.getBoundingClientRect();
        const top = Math.max(50, rect.top + window.scrollY - 350);
        const left = rect.right + window.scrollX + 40;

        const shortsTitle = reel?.querySelector('h2')?.innerText || reel?.querySelector('.title')?.innerText || "YouTube Short";

        removeUI();
        showLoadingCard(top, left, "Analyzing with ScrollSafe...");
        showGlobalLoader();

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'checkVideoFact',
                videoUrl: videoUrl,
                context: shortsTitle
            });

            isAnalyzingVideo = false;
            label.classList.remove('loading');

            if (response.error) {
                showErrorCard(response.error, top, left);
            } else {
                showResultCard(response.data, top, left);
            }
        } catch (err) {
            isAnalyzingVideo = false;
            label.classList.remove('loading');
            showErrorCard(`Extension error: ${err.message || 'Analysis failed.'}`, top, left);
        }
    });

    tray.appendChild(label);
}

function addFloatingBtn(parent, getUrlFunc, isX = false) {
    const btn = document.createElement('button');
    btn.className = `scrollsafe-video-btn ${isX ? 'scrollsafe-btn-x' : ''}`;
    const strokeColor = isX ? 'white' : '#3b82f6';

    btn.innerHTML = `
        <svg id="scrollsafe-float-icon" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="3">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    `;

    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (isAnalyzingVideo) return;
        isAnalyzingVideo = true;

        btn.classList.add('loading');
        const videoUrl = getUrlFunc();
        const top = window.scrollY + 100;
        const left = window.scrollX + (window.innerWidth / 2) - 190;

        // Extract Tweet text from X
        let tweetText = "";
        try {
            const tweetContainer = btn.closest('article') || btn.closest('div[data-testid="cellInnerDiv"]');
            tweetText = tweetContainer?.querySelector('div[data-testid="tweetText"]')?.innerText || "";
        } catch (e) { }

        showLoadingCard(top, left, "Analyzing Video with ScrollSafe...");
        showGlobalLoader();

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'checkVideoFact',
                videoUrl: videoUrl,
                context: tweetText
            });

            isAnalyzingVideo = false;
            btn.classList.remove('loading');

            if (response.error) {
                showErrorCard(response.error, top, left);
            } else {
                showResultCard(response.data, top, left);
            }
        } catch (err) {
            isAnalyzingVideo = false;
            btn.classList.remove('loading');
            showErrorCard(`Extension error: ${err.message || 'Operation failed.'}`, top, left);
        }
    });

    parent.style.position = parent.style.position || 'relative';
    parent.appendChild(btn);
}


// Run injection periodically to handle dynamic content
setInterval(injectVideoButtons, 2000);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'triggerImageCheck' || message.action === 'triggerVideoCheck') {
        const top = window.scrollY + Math.max(100, window.innerHeight / 2 - 100);
        const left = window.scrollX + Math.max(50, window.innerWidth / 2 - 170);

        removeUI();
        const loadingMsg = message.action === 'triggerImageCheck' ? "Analyzing Image..." : "Analyzing Video Content...";
        showLoadingCard(top, left, loadingMsg);
        showGlobalLoader();

        const action = message.action === 'triggerImageCheck' ? 'checkFact' : 'checkVideoFact';
        const payload = message.action === 'triggerImageCheck'
            ? { action, imageUrl: message.imageUrl }
            : { action, videoUrl: message.videoUrl };

        chrome.runtime.sendMessage(payload).then(response => {
            if (response.error) {
                showErrorCard(response.error, top, left);
            } else {
                showResultCard(response.data, top, left);
            }
        }).catch(err => {
            showErrorCard(`Extension error: ${err.message || 'Could not contact background script.'}`, top, left);
        });
    }
});


