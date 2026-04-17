document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['scrollSafeReport'], (result) => {
        const data = result.scrollSafeReport;
        if (!data) {
            document.getElementById('report-content').innerHTML = `
                <div class="card" style="text-align: center;">
                    <h2>No Report Data Found</h2>
                    <p class="explanation" style="margin-top:10px;">Please highlight text and create a fact-check report first.</p>
                </div>
            `;
            return;
        }

        renderDashboard(data);
    });
});

// Confidence comes natively as integer from AI now

function renderDashboard(data) {
    const main = document.getElementById('report-content');
    const sources = data.sources || { qdrant: [], news: [] };
    const isImage = !!(data.visualMatches && data.visualMatches.length > 0);
    
    // Evaluate Data Availability
    const strongQdrantMatches = (sources.qdrant || []).filter(item => item.score > 0.85);
    const hasQdrant = strongQdrantMatches.length > 0;
    
    // Build Database Items
    let qdrantHTML = '';
    if (hasQdrant) {
        strongQdrantMatches.forEach(item => {
            const similarity = (item.score * 100).toFixed(1);
            let scoreColor = item.score > 0.8 ? 'green' : 'gray';
            if (item.score < 0.5) scoreColor = 'red';
            
            qdrantHTML += `
                <div class="evidence-item">
                    <div class="evidence-meta">
                        <span class="evidence-source">Database Memory • ${similarity}% Match</span>
                        <span class="evidence-item-title">${item.claim}</span>
                        <span style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                            <strong>Label:</strong> ${item.label.toUpperCase()} • <strong>Fact Checkers:</strong> ${item.fact_checkers}
                            <br>${item.explanation}
                        </span>
                    </div>
                </div>
            `;
        });
    }

    // Build News Items
    let newsHTML = '';
    if (sources.news && sources.news.length > 0) {
        sources.news.forEach(item => {
            newsHTML += `
                <div class="evidence-item">
                    <div class="evidence-meta">
                        <span class="evidence-source">${item.source} • ${item.date}</span>
                        <span class="evidence-item-title">${item.title}</span>
                    </div>
                    <a href="${item.link}" target="_blank" class="evidence-link-btn">Read Article</a>
                </div>
            `;
        });
    } else {
        if (data.score && parseFloat(data.score) > 0.85) {
            newsHTML = `<div class="evidence-item" style="text-align: center; padding: 40px 20px; flex-direction: column;">
                <svg style="margin-bottom: 16px; width: 32px; height: 32px; color: var(--color-brand);" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <div style="font-weight: bold; margin-bottom: 8px;">Skipped Live Search</div>
                <div style="color: var(--text-secondary); font-size: 14px;">Database match was extremely high (>85%). No further verification required.</div>
            </div>`;
        } else {
            newsHTML = `<div class="evidence-item" style="text-align: center; padding: 40px 20px; flex-direction: column;">
                <div style="font-weight: bold; margin-bottom: 8px;">Zero Coverage</div>
                <div style="color: var(--text-secondary); font-size: 14px;">${isImage ? 'No direct breaking news found, but visual evidence and historical records were discovered below.' : 'No breaking news found corroborating or contradicting this.'}</div>
            </div>`;
        }
    }

    // Build Visual Citations Gallery if image
    let galleryHTML = '';
    if (isImage) {
        galleryHTML = `
            <div class="visual-citations-grid">
                ${data.visualMatches.slice(0, 6).map((v, i) => {
                    return `
                        <a href="${v.link}" target="_blank" class="visual-citation-item">
                            <div class="vc-image-container">
                                <img src="${v.thumbnail}" alt="${v.title}">
                            </div>
                            <div class="vc-text-content">
                                <span class="vc-source">${v.source || 'Direct Source'}</span>
                                <p class="vc-title">${v.title.split('...')[0].substring(0, 65)}${v.title.length > 65 ? '...' : ''}</p>
                            </div>
                        </a>
                    `;
                }).join('')}
            </div>
        `;
    }

    let parsedConf = parseInt(data.confidence);
    const confVal = !isNaN(parsedConf) ? parsedConf : 50;

    let verdictIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    let verdictKey = data.verdict?.toLowerCase() || 'uncertain';
    let bgClass = 'verdict-bg-default';
    
    if (verdictKey === 'true') {
        verdictIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>';
        bgClass = 'verdict-bg-true';
    } else if (verdictKey === 'false') {
        verdictIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>';
        bgClass = 'verdict-bg-false';
    } else if (verdictKey === 'uncertain' || verdictKey === 'misleading') {
        verdictIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>';
        bgClass = 'verdict-bg-uncertain';
    }

    main.innerHTML = `
        <div class="result-stack">
            <!-- Verdict Header Top Bar -->
            <div class="verdict-header ${bgClass}">
                <div class="verdict-title">
                    ${verdictIcon}
                    <span>${data.verdict || 'Uncertain'}</span>
                </div>
                <div class="verdict-confidence">
                    <span class="conf-label">Confidence</span>
                    <span class="conf-value">${confVal}%</span>
                </div>
            </div>

            <!-- Vertical Stack Content -->
            <div class="result-content">
                <!-- Main Explanation -->
                <div>
                    ${!isImage && data.claim ? `<div class="claim-text">"${data.claim}"</div>` : ''}
                    <p class="explanation-text">${data.explanation || 'Detailed analysis is currently pending. Please check source records.'}</p>
                </div>

                <!-- Web Evidence -->
                ${newsHTML ? `
                <div class="evidence-section">
                    <h3 class="evidence-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 
                        Verified Web Sources
                    </h3>
                    <div class="evidence-list">
                        ${newsHTML}
                    </div>
                </div>
                ` : ''}

                <!-- Visual Citations -->
                ${galleryHTML ? `
                <div class="evidence-section">
                    <h3 class="evidence-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Visual Citations
                    </h3>
                    ${galleryHTML}
                </div>
                ` : ''}

                <!-- Historical Database Matches -->
                ${hasQdrant ? `
                <div class="evidence-section">
                    <h3 class="evidence-title">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        Historical Database Matches
                    </h3>
                    <div class="evidence-list">
                        ${qdrantHTML}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}
