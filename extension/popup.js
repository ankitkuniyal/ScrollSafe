document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggle-extension');

    chrome.storage.local.get(['isEnabled'], (result) => {
        if (result.isEnabled !== undefined) {
            toggle.checked = result.isEnabled;
        }
    });

    toggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ isEnabled: e.target.checked });
    });
});
