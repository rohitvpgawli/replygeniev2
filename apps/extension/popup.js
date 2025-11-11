/**
 * ReplyGenie Chrome Extension - Popup Script
 */

const elements = {
  loading: document.getElementById('loading'),
  content: document.getElementById('content'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  statusDetails: document.getElementById('statusDetails'),
  connectBtn: document.getElementById('connectBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
};

/**
 * Check authentication status
 */
async function checkAuth() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    return response.authenticated;
  } catch (error) {
    console.error('Error checking auth:', error);
    return false;
  }
}

/**
 * Update UI based on auth status
 */
async function updateUI() {
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    // Connected state
    elements.statusDot.classList.add('connected');
    elements.statusText.textContent = 'Connected';
    elements.statusDetails.textContent = 'Extension is ready to generate drafts';
    elements.connectBtn.classList.add('hidden');
    elements.logoutBtn.classList.remove('hidden');
  } else {
    // Disconnected state
    elements.statusDot.classList.remove('connected');
    elements.statusText.textContent = 'Not Connected';
    elements.statusDetails.textContent = 'Connect to start generating drafts';
    elements.connectBtn.classList.remove('hidden');
    elements.logoutBtn.classList.add('hidden');
  }
  
  // Show content, hide loading
  elements.loading.classList.add('hidden');
  elements.content.classList.remove('hidden');
}

/**
 * Handle connect button click
 */
elements.connectBtn.addEventListener('click', async () => {
  elements.connectBtn.textContent = 'Connecting...';
  elements.connectBtn.disabled = true;
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'REQUEST_AUTH' });
    
    if (response.success) {
      await updateUI();
    } else {
      alert(`Connection failed: ${response.error}`);
      elements.connectBtn.textContent = 'Connect to ReplyGenie';
      elements.connectBtn.disabled = false;
    }
  } catch (error) {
    alert(`Connection error: ${error.message}`);
    elements.connectBtn.textContent = 'Connect to ReplyGenie';
    elements.connectBtn.disabled = false;
  }
});

/**
 * Handle logout button click
 */
elements.logoutBtn.addEventListener('click', async () => {
  const confirmed = confirm('Are you sure you want to disconnect?');
  
  if (confirmed) {
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });
    await updateUI();
  }
});

/**
 * Initialize popup
 */
updateUI();
