// Background service worker
// Handles extension lifecycle and messaging

chrome.runtime.onInstalled.addListener(() => {
  // Extension installed successfully
});

// Message listener for future features
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendResponse({ status: "ok" });
});
