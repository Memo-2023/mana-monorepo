// Background service worker for Kokon Browser Extension

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Kokon extension installed');
    
    // Optionally open the web app on first install
    chrome.tabs.create({
      url: 'http://localhost:8081' // Local Expo web development server
    });
  }
});

// Handle extension icon click (this is mainly handled by the popup, but kept for completeness)
chrome.action.onClicked.addListener((tab) => {
  // This won't fire if popup.html is defined in manifest, but keeping for fallback
  console.log('Extension icon clicked for tab:', tab.url);
});

// Listen for messages from content scripts (if needed in the future)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  // Handle any background tasks here
  if (request.action === 'saveArticle') {
    // This could be used for context menu integration in the future
    console.log('Save article request for:', request.url);
  }
  
  return true; // Keep message channel open for async response
});

// Sync storage with web app (for session management)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    console.log('Storage changed:', changes);
    
    // Monitor auth state changes
    if (changes['supabase.auth.token']) {
      const newToken = changes['supabase.auth.token'].newValue;
      if (newToken) {
        console.log('User logged in');
        // Could update badge or perform other actions
      } else {
        console.log('User logged out');
      }
    }
  }
});

// Handle context menu (optional future feature)
// chrome.contextMenus.create({
//   id: "saveToKokon",
//   title: "Save to Kokon",
//   contexts: ["page", "link"]
// });

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === "saveToKokon") {
//     const url = info.linkUrl || tab.url;
//     // Handle saving the article
//   }
// });