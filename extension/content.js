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
    const verdictClass = `verdict-${verdict.toLowerCase()}`;
    
    card.innerHTML = `
        <h3>
            <span>Verdict: <span class="${verdictClass}">${verdict.toUpperCase()}</span></span>
            <button class="close-btn">&times;</button>
        </h3>
        <p><strong>Confidence:</strong> ${data.confidence || 'Medium'}</p>
        <p>${data.explanation || 'No further explanation provided by the fact-checking API.'}</p>
    `;
    
    card.querySelector('.close-btn').addEventListener('click', () => {
        card.remove();
        currentCard = null;
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
