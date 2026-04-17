let currentBtn = null;
let currentCard = null;

function removeUI() {
    if (currentBtn) {
        currentBtn.remove();
        currentBtn = null;
    }
    if (currentCard) {
        currentCard.remove();
        currentCard = null;
    }
}

function preprocessText(text) {
    let clean = text.replace(/\s+/g, ' ').trim();
    const match = clean.match(/[^.!?]+[.!?]+/);
    const mainClaim = match ? match[0] : clean;
    return mainClaim.substring(0, 300).toLowerCase();
}

document.addEventListener('mouseup', (e) => {
    chrome.storage.local.get(['isEnabled'], (result) => {
        if (result.isEnabled === false) return; // Extension is disabled

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
                btn.innerText = 'Check with ScrollSafe';
                // Position relative to document
                btn.style.top = `${rect.bottom + window.scrollY + 8}px`;
                btn.style.left = `${rect.left + window.scrollX}px`;

                btn.addEventListener('mousedown', async (ev) => {
                    ev.preventDefault(); // maintain selection highlighting
                    ev.stopPropagation();
                    
                    const processed = preprocessText(text);
                    if (currentBtn) currentBtn.remove();
                    currentBtn = null;

                    showLoadingCard(rect.bottom + window.scrollY + 8, rect.left + window.scrollX);

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
                        showErrorCard('Extension error: Could not contact background script.', rect.bottom + window.scrollY + 8, rect.left + window.scrollX);
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

function showLoadingCard(top, left) {
    const card = createBaseCard(top, left);
    card.innerHTML = `
        <div id="scrollsafe-loader">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            Analyzing with ScrollSafe...
        </div>
    `;
    document.body.appendChild(card);
    currentCard = card;
}

function showResultCard(data, top, left) {
    const card = createBaseCard(top, left);
    const verdict = data.verdict || 'uncertain';
    const vLower = verdict.toLowerCase();
    
    let iconSvg = '';
    if (vLower === 'false') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (vLower === 'true') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }

    card.innerHTML = `
        <div class="scrollsafe-header header-${vLower}">
            <div class="scrollsafe-header-content">
                ${iconSvg}
                <span>${verdict.toUpperCase()} CLAIM DETECTED</span>
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
        <h3>Error <button class="close-btn">&times;</button></h3>
        <p style="color: #dc2626">${errorMsg}</p>
    `;
    
    card.querySelector('.close-btn').addEventListener('click', () => {
        card.remove();
        currentCard = null;
    });

    document.body.appendChild(card);
    currentCard = card;
}
