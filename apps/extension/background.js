/**
 * ReplyGenie Chrome Extension - Background Service Worker
 * Handles authentication, API calls, and message passing
 */

const API_BASE_URL = 'http://localhost:3000'; // TODO: Make configurable for production

// Store auth state
let authToken = null;
let tokenExpiry = null;

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('ReplyGenie extension installed');
  
  // Load saved token from storage
  chrome.storage.local.get(['authToken', 'tokenExpiry'], (result) => {
    if (result.authToken && result.tokenExpiry) {
      authToken = result.authToken;
      tokenExpiry = result.tokenExpiry;
      
      // Check if token is expired
      if (Date.now() > tokenExpiry) {
        console.log('Stored token expired, clearing');
        clearAuth();
      }
    }
  });
});

/**
 * Clear authentication state
 */
function clearAuth() {
  authToken = null;
  tokenExpiry = null;
  chrome.storage.local.remove(['authToken', 'tokenExpiry']);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return authToken && tokenExpiry && Date.now() < tokenExpiry;
}

/**
 * Request auth token from web app
 * Opens web app in new tab for user to authenticate
 */
async function requestAuth() {
  return new Promise((resolve, reject) => {
    // Open web app settings page
    chrome.tabs.create({
      url: `${API_BASE_URL}/app/settings/integrations?extension=true`
    }, (tab) => {
      // Listen for token from web app
      const listener = (message, sender, sendResponse) => {
        if (message.type === 'AUTH_TOKEN' && sender.tab?.id === tab.id) {
          authToken = message.token;
          tokenExpiry = Date.now() + (message.expiresIn * 1000);
          
          // Save to storage
          chrome.storage.local.set({
            authToken,
            tokenExpiry
          });
          
          chrome.runtime.onMessage.removeListener(listener);
          resolve(authToken);
        }
      };
      
      chrome.runtime.onMessage.addListener(listener);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(listener);
        reject(new Error('Authentication timeout'));
      }, 5 * 60 * 1000);
    });
  });
}

/**
 * Generate draft via API
 */
async function generateDraft(reviewData) {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`${API_BASE_URL}/api/extension/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(reviewData)
  });
  
  if (response.status === 401) {
    // Token expired, clear auth
    clearAuth();
    throw new Error('Authentication expired');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate draft');
  }
  
  return await response.json();
}

/**
 * Handle messages from content script and popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_AUTH') {
    sendResponse({ authenticated: isAuthenticated() });
    return true;
  }
  
  if (message.type === 'REQUEST_AUTH') {
    requestAuth()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'GENERATE_DRAFT') {
    generateDraft(message.data)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'LOGOUT') {
    clearAuth();
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Handle token refresh before expiry
 */
setInterval(() => {
  if (authToken && tokenExpiry) {
    const timeUntilExpiry = tokenExpiry - Date.now();
    
    // If token expires in less than 2 minutes, clear it
    // User will need to re-authenticate
    if (timeUntilExpiry < 2 * 60 * 1000) {
      console.log('Token expiring soon, clearing');
      clearAuth();
    }
  }
}, 60 * 1000); // Check every minute
