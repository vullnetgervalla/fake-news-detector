chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getApiKey") {
        chrome.storage.local.get(['GoogleApiKey'], result => {
            sendResponse({ apiKey: result.GoogleApiKey });
        });
        return true;
    }
});
