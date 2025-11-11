/**
 * ReplyGenie Chrome Extension - Content Script
 * Injects "Generate Draft" button on Google Business Profile review pages
 */

console.log('ReplyGenie content script loaded');

// Configuration
const BUTTON_ID = 'replygenie-generate-btn';
const BUTTON_CLASS = 'replygenie-btn';
const INJECT_CHECK_INTERVAL = 2000; // Check every 2 seconds
const TEXTAREA_SELECTORS = [
  'textarea[aria-label*="reply" i]',
  'textarea[placeholder*="reply" i]',
  'textarea[aria-label*="response" i]',
  '.review-reply-textarea',
  '[data-review-reply-input]'
];

/**
 * Find review reply textarea on the page
 */
function findReplyTextarea() {
  for (const selector of TEXTAREA_SELECTORS) {
    const textarea = document.querySelector(selector);
    if (textarea && textarea.offsetParent !== null) { // Check if visible
      return textarea;
    }
  }
  return null;
}

/**
 * Extract review data from the page
 */
function extractReviewData() {
  // Try to find review text and rating
  // Note: These selectors may need adjustment based on actual GBP page structure
  
  const reviewTextElement = document.querySelector('[data-review-text], .review-text, [aria-label*="review text" i]');
  const reviewText = reviewTextElement?.textContent?.trim() || '';
  
  // Try to find star rating
  const ratingElement = document.querySelector('[aria-label*="star" i], .star-rating, [data-rating]');
  let starRating = 5; // Default to 5 stars
  
  if (ratingElement) {
    const ariaLabel = ratingElement.getAttribute('aria-label');
    const match = ariaLabel?.match(/(\d+)\s*star/i);
    if (match) {
      starRating = parseInt(match[1], 10);
    }
  }
  
  return {
    reviewText,
    starRating
  };
}

/**
 * Create and inject the "Generate Draft" button
 */
function injectButton(textarea) {
  // Check if button already exists
  if (document.getElementById(BUTTON_ID)) {
    return;
  }
  
  // Create button
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.className = BUTTON_CLASS;
  button.textContent = '✨ Generate Draft';
  button.type = 'button';
  
  // Style the button (Apple-inspired)
  button.style.cssText = `
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    margin: 8px 0;
    background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
  `;
  
  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-1px)';
    button.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.4)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
  });
  
  // Active effect
  button.addEventListener('mousedown', () => {
    button.style.transform = 'scale(0.98)';
  });
  
  button.addEventListener('mouseup', () => {
    button.style.transform = 'scale(1)';
  });
  
  // Click handler
  button.addEventListener('click', async () => {
    await handleGenerateDraft(button, textarea);
  });
  
  // Insert button near textarea
  const parent = textarea.parentElement;
  if (parent) {
    parent.insertBefore(button, textarea);
  }
  
  console.log('ReplyGenie button injected');
}

/**
 * Handle draft generation
 */
async function handleGenerateDraft(button, textarea) {
  const originalText = button.textContent;
  
  try {
    // Check authentication
    button.textContent = '🔐 Checking auth...';
    button.disabled = true;
    
    const authCheck = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    
    if (!authCheck.authenticated) {
      button.textContent = '🔐 Authenticating...';
      
      // Request authentication
      const authResult = await chrome.runtime.sendMessage({ type: 'REQUEST_AUTH' });
      
      if (!authResult.success) {
        throw new Error('Authentication failed. Please try again.');
      }
    }
    
    // Extract review data
    const reviewData = extractReviewData();
    
    if (!reviewData.reviewText) {
      throw new Error('Could not find review text on page');
    }
    
    // Generate draft
    button.textContent = '✨ Generating...';
    
    const result = await chrome.runtime.sendMessage({
      type: 'GENERATE_DRAFT',
      data: reviewData
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate draft');
    }
    
    // Insert draft into textarea
    textarea.value = result.data.draft;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Success feedback
    button.textContent = '✅ Draft inserted!';
    button.style.background = 'linear-gradient(135deg, #34C759 0%, #30A14E 100%)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)';
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Draft generation error:', error);
    
    button.textContent = '❌ Error';
    button.style.background = 'linear-gradient(135deg, #FF3B30 0%, #D70015 100%)';
    
    // Show error message
    alert(`ReplyGenie Error: ${error.message}`);
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)';
      button.disabled = false;
    }, 2000);
  }
}

/**
 * Inject fallback link if textarea not found
 */
function injectFallbackLink() {
  const existingLink = document.getElementById('replygenie-fallback-link');
  if (existingLink) {
    return;
  }
  
  const link = document.createElement('a');
  link.id = 'replygenie-fallback-link';
  link.href = 'http://localhost:3000/app/inbox';
  link.target = '_blank';
  link.textContent = '📝 Open ReplyGenie Inbox';
  link.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
    transition: all 0.2s ease;
  `;
  
  link.addEventListener('mouseenter', () => {
    link.style.transform = 'translateY(-2px)';
    link.style.boxShadow = '0 6px 20px rgba(0, 122, 255, 0.5)';
  });
  
  link.addEventListener('mouseleave', () => {
    link.style.transform = 'translateY(0)';
    link.style.boxShadow = '0 4px 16px rgba(0, 122, 255, 0.4)';
  });
  
  document.body.appendChild(link);
  console.log('ReplyGenie fallback link injected');
}

/**
 * Main injection logic
 */
function tryInject() {
  const textarea = findReplyTextarea();
  
  if (textarea) {
    injectButton(textarea);
  } else {
    // Show fallback link if on GBP domain
    if (window.location.hostname.includes('business.google.com')) {
      injectFallbackLink();
    }
  }
}

// Initial injection attempt
setTimeout(tryInject, 1000);

// Periodic check for dynamic content
setInterval(tryInject, INJECT_CHECK_INTERVAL);

// Watch for DOM changes (for SPAs)
const observer = new MutationObserver(() => {
  tryInject();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
