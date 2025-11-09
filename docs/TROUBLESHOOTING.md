# Troubleshooting Guide

## OAuth Configuration Error

### Error Message
```
{"error":"OAuth configuration error"}
```

### Cause
Missing `GOOGLE_OAUTH_REDIRECT` environment variable in root `.env` file.

### Solution

1. **Add to your root `.env` file** (not `apps/web/.env`):
   ```env
   GOOGLE_OAUTH_REDIRECT=http://localhost:3000/api/google/oauth/callback
   ```

2. **Verify your Google Cloud Console has both redirect URIs**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services > Credentials
   - Click on your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", ensure you have:
     - `http://localhost:3000/api/auth/google/callback` (for user sign-in)
     - `http://localhost:3000/api/google/oauth/callback` (for GBP integration)

3. **Restart your dev server**:
   ```bash
   # Stop the server (Ctrl+C)
   pnpm dev
   ```

4. **Test the connection**:
   - Navigate to Settings → Integrations
   - Click "Connect Google Business Profile"
   - Should redirect to Google OAuth consent screen

---

## Environment Variables Not Loading

### Symptoms
- API endpoints return configuration errors
- Features don't work despite correct `.env` setup

### Solution

1. **Verify `.env` file location**:
   - Must be in **root directory** (`/Users/rohitgawli/Documents/GitHub/replygeniev2/.env`)
   - NOT in `apps/web/.env`

2. **Check required variables**:
   ```env
   # Database
   POSTGRES_URL=postgresql://...
   
   # Base URL
   BASE_URL=http://localhost:3000
   
   # Auth
   AUTH_SECRET=your-secret-here
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_OAUTH_REDIRECT=http://localhost:3000/api/google/oauth/callback
   
   # Encryption
   TOKEN_ENCRYPTION_KEY=your-64-char-hex-string
   
   # AI (Gemini)
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. **Restart dev server** after any `.env` changes

4. **Verify loading** by checking server logs on startup

---

## Database Connection Issues

### Error: "Failed to connect to database"

### Solution

1. **Check Docker is running**:
   ```bash
   docker ps
   ```
   Should show PostgreSQL container running

2. **Verify `POSTGRES_URL`** in `.env`:
   ```env
   POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres
   ```

3. **Run migrations**:
   ```bash
   pnpm db:migrate
   ```

---

## Google Business Profile API Errors

### Error: 403 - Location not verified

**Cause**: The Google Business Profile location is not verified.

**Solution**:
1. Go to [Google Business Profile](https://business.google.com/)
2. Verify your location (Google will send a postcard with verification code)
3. Wait for verification to complete
4. Retry syncing in ReplyGenie

### Error: 429 - Rate limit exceeded

**Cause**: Too many API requests to Google.

**Solution**:
- Wait a few minutes before retrying
- The system has built-in retry logic with exponential backoff
- Check the error message for retry-after time

### Error: 401 - Invalid credentials

**Cause**: OAuth token expired or invalid.

**Solution**:
1. Go to Settings → Integrations
2. Click "Reconnect"
3. Complete OAuth flow again

---

## Draft Generation Issues

### Error: "Failed to generate draft"

**Possible Causes**:
1. **Missing Gemini API key**:
   - Add `GEMINI_API_KEY` to root `.env`
   - Get key from [Google AI Studio](https://aistudio.google.com/app/apikey)

2. **API quota exceeded**:
   - Check Gemini API quota in Google Cloud Console
   - Wait for quota reset or upgrade plan

3. **Invalid review data**:
   - Ensure review has text content
   - Check review is not deleted

---

## Quota System Issues

### Error: 429 - Monthly quota exceeded

**Cause**: Team has posted 100 replies this month (default limit).

**Solution**:
- Wait until next month for quota reset
- Or increase quota in database:
  ```sql
  UPDATE rc_usage 
  SET quota_limit = 200 
  WHERE team_id = YOUR_TEAM_ID 
  AND month = 'YYYY-MM';
  ```

---

## UI Issues

### Filters not working in Inbox

**Solution**:
1. Check browser console for errors
2. Verify `/api/v1/locations` returns array
3. Verify `/api/v1/reviews` endpoint works
4. Clear browser cache and reload

### Settings tabs not showing

**Solution**:
1. Verify you're on `/app/settings/general`, `/app/settings/integrations`, or `/app/settings/brand-voice`
2. Check browser console for routing errors
3. Ensure `layout.tsx` is in `/app/app/settings/` directory

---

## Development Server Issues

### Port already in use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 pnpm dev
```

### Hot reload not working

**Solution**:
1. Restart dev server
2. Clear `.next` cache:
   ```bash
   rm -rf apps/web/.next
   pnpm dev
   ```

---

## Production Deployment Issues

### Environment variables not set

**Solution**:
1. Ensure all required env vars are set in deployment platform
2. Use the same variable names as in `.env.example`
3. Update `GOOGLE_OAUTH_REDIRECT` to production URL:
   ```env
   GOOGLE_OAUTH_REDIRECT=https://yourdomain.com/api/google/oauth/callback
   ```

### Database migrations not applied

**Solution**:
```bash
pnpm db:migrate
```

---

## Getting Help

If you encounter an issue not covered here:

1. **Check server logs** for detailed error messages
2. **Check browser console** for client-side errors
3. **Review audit logs** in database for action history
4. **Check Phase 2 Audit** (`/docs/PHASE2_AUDIT.md`) for implementation details

---

## Common Checklist

Before reporting an issue, verify:

- [ ] Root `.env` file exists with all required variables
- [ ] Dev server restarted after `.env` changes
- [ ] Docker containers running (for database)
- [ ] Database migrations applied
- [ ] Google Cloud Console OAuth settings correct
- [ ] Browser cache cleared
- [ ] No console errors in browser dev tools
- [ ] Server logs checked for errors

---

**Last Updated**: November 9, 2024
