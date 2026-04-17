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
    
    // Evaluate Data Availability
    const strongQdrantMatches = (sources.qdrant || []).filter(item => item.score > 0.85);
    const hasQdrant = strongQdrantMatches.length > 0;
    
    // Build Database Items
    let qdrantHTML = '';
    if (hasQdrant) {
        strongQdrantMatches.forEach(item => {
            const similarity = (item.score * 100).toFixed(1);
            let scoreColor = item.score > 0.8 ? 'verdict-TRUE' : 'verdict-UNCERTAIN';
            if (item.score < 0.5) scoreColor = 'verdict-FALSE';
            
            qdrantHTML += `
                <div class="source-item">
                    <div class="source-meta">
                        <span>Database Memory</span>
                        <span class="badge ${scoreColor}" style="color:var(--text-primary); border:1px solid rgba(0,0,0,0.1);">${similarity}% Match</span>
                    </div>
                    <div class="source-title">${item.claim}</div>
                    <div class="source-desc" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05);">
                        <strong style="color: var(--text-primary);">Label:</strong> ${item.label.toUpperCase()}<br>
                        <strong style="color: var(--text-primary);">Fact Checkers:</strong> ${item.fact_checkers}<br>
                        <strong style="color: var(--text-primary);">Explanation:</strong> ${item.explanation}
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
                <div class="source-item">
                    <div class="source-meta">
                        <span>${item.source}</span>
                        <span style="color:var(--text-secondary); font-weight:500;">${item.date}</span>
                    </div>
                    <div class="source-title">
                        <a href="${item.link}" target="_blank">${item.title} ↗</a>
                    </div>
                    ${item.snippet ? `<div class="source-desc" style="margin-top: 8px;">${item.snippet}</div>` : ''}
                </div>
            `;
        });
    } else {
        if (data.score && parseFloat(data.score) > 0.85) {
            newsHTML = `<div class="source-item" style="text-align: center; padding: 40px 20px;">
                <svg style="margin-bottom: 16px; width: 32px; height: 32px; color: var(--color-brand);" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg><br>
                <div class="source-title">Skipped Live Search</div>
                <div class="source-desc">Database match was extremely high (>85%). No further verification required.</div>
            </div>`;
        } else {
            newsHTML = `<div class="source-item" style="text-align: center; padding: 40px 20px;">
                <p class="source-title">Zero Coverage</p>
                <p class="source-desc">No breaking news found corroborating or contradicting this.</p>
            </div>`;
        }
    }

    let parsedConf = parseInt(data.confidence);
    const confVal = !isNaN(parsedConf) ? parsedConf : 50;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    // Calculate SVG offset to simulate bar filling up
    const offset = circumference - (confVal / 100) * circumference;

    main.innerHTML = `
        <div class="card hero-layout">
            <div class="hero-content">
                <div class="verdict-badge verdict-${data.verdict}">${data.verdict}</div>
                <div class="claim-text">"${data.claim}"</div>
                <div class="explanation">
                    <span class="analysis-label">Analysis</span>${data.explanation}
                </div>
            </div>
            
            <div class="hero-meter">
                <svg class="meter-svg" viewBox="0 0 160 160">
                    <circle class="meter-circle-bg" cx="80" cy="80" r="70"></circle>
                    <circle class="meter-circle-fg stroke-${data.verdict}" cx="80" cy="80" r="70" 
                        stroke-dasharray="${circumference}" 
                        stroke-dashoffset="${circumference}">
                    </circle>
                </svg>
                <div class="meter-text" style="color: var(--color-${data.verdict.toLowerCase()})">${confVal}%</div>
                <div class="meter-label">Confidence</div>
            </div>
        </div>

        <div class="grid-container ${hasQdrant ? 'grid-2' : 'grid-1'}">
            ${hasQdrant ? `
                <div class="card" style="margin-bottom: 0;">
                    <div class="section-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                        Historical Database
                    </div>
                    ${qdrantHTML}
                </div>
            ` : ''}
            
            <div class="card" style="margin-bottom: 0;">
                <div class="section-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    Live Web Verification
                </div>
                ${newsHTML}
            </div>
        </div>
    `;

    // Trigger animation for circular meter after render
    setTimeout(() => {
        const circle = main.querySelector('.meter-circle-fg');
        if (circle) circle.style.strokeDashoffset = offset;
    }, 100);
}
