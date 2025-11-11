# ReplyGenie Chrome Extension

AI-powered review reply assistant for Google Business Profile.

## Features

- **In-Page Draft Generation**: Click "Generate Draft" button directly on GBP review pages
- **Secure Authentication**: Short-lived JWT tokens (15 min expiry)
- **Apple-Grade Design**: Beautiful, minimal UI with smooth animations
- **Fallback Support**: Opens web app if button injection fails

## Installation (Development)

1. Build the extension (if using a bundler):
   ```bash
   cd apps/extension
   # No build step needed for vanilla JS version
   ```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select `apps/extension/` folder

3. Pin extension to toolbar for easy access

## Usage

### First Time Setup

1. Click the ReplyGenie extension icon in your toolbar
2. Click "Connect to ReplyGenie"
3. This opens the web app where you'll authenticate
4. Once authenticated, the extension is ready

### Generating Drafts

**Method 1: On GBP Page**
1. Go to [Google Business Profile](https://business.google.com/)
2. Navigate to a review that needs a reply
3. Click "Reply" to open the reply textarea
4. Click the "✨ Generate Draft" button
5. Draft will be automatically inserted into the textarea

**Method 2: Fallback**
- If the button doesn't appear, click "📝 Open ReplyGenie Inbox" link (bottom right)
- This opens the web app inbox where you can manage all reviews

## Architecture

### Files

- **manifest.json**: Chrome extension configuration (MV3)
- **background.js**: Service worker for auth and API calls
- **content.js**: Injects button on GBP pages
- **popup.html/js**: Extension popup UI
- **icons/**: Extension icons (16x16, 48x48, 128x128)

### Authentication Flow

1. User clicks "Connect" in popup
2. Background worker opens web app in new tab
3. User authenticates in web app
4. Web app sends JWT token to extension via `chrome.runtime.sendMessage`
5. Extension stores token in `chrome.storage.local`
6. Token is valid for 15 minutes

### API Communication

- Extension uses `Authorization: Bearer <token>` header
- Calls `/api/extension/draft` endpoint
- No Google OAuth tokens stored in extension (security best practice)

## Security

- ✅ No Google OAuth tokens in extension
- ✅ Short-lived JWT (15 min expiry)
- ✅ Tokens stored in `chrome.storage.local` (encrypted by Chrome)
- ✅ HTTPS only in production
- ✅ Host permissions limited to `business.google.com`

## Troubleshooting

### Button Not Appearing

The extension tries multiple selectors to find the reply textarea. If it fails:
- Use the fallback "Open Inbox" link (bottom right)
- Report the issue with page URL and screenshot

### Authentication Expired

Tokens expire after 15 minutes. Click the extension icon and reconnect.

### API Errors

- Check that web app is running (`http://localhost:3000`)
- Verify you're logged into the web app
- Check browser console for error messages

## Production Deployment

1. Update `API_BASE_URL` in `background.js` to production URL
2. Update links in `popup.html` to production URL
3. Update `content.js` fallback link to production URL
4. Create proper icons (16x16, 48x48, 128x128 PNG)
5. Zip the extension folder
6. Submit to Chrome Web Store

## Development Notes

- Uses vanilla JavaScript (no build step required)
- Manifest V3 compliant
- Apple-inspired design system
- Follows Chrome extension best practices
- No external dependencies

## Future Enhancements

- [ ] Offline draft caching
- [ ] Keyboard shortcuts (Cmd+Shift+G)
- [ ] Draft preview before insertion
- [ ] Multi-language support
- [ ] Custom brand voice per location
