# Google API Rate Limit Fix

## Issue
User encountered 429 (Too Many Requests) error when syncing locations from Google Business Profile API.

## Root Cause
Google Business Profile API has rate limits:
- **Per-user quota**: 60 requests per minute
- **Per-project quota**: Varies by API
- No retry logic was implemented

## Solution Implemented

### 1. Exponential Backoff Retry Logic
Added `fetchWithRetry()` helper function in `gbp-client.ts`:
- Automatically retries on 429 errors
- Respects `Retry-After` header if present
- Exponential backoff: 1s, 2s, 4s (max 10s)
- Max 3 retry attempts

### 2. Applied to All GBP API Calls
- `fetchAccounts()` - Get Google Business accounts
- `fetchLocations()` - Get locations for an account
- `fetchReviews()` - Get reviews for a location

### 3. User-Friendly Error Messages
Updated `/api/v1/locations/sync` to return:
```json
{
  "error": "Google API rate limit reached. Please wait a few minutes and try again.",
  "retryAfter": 60
}
```

## Files Modified
1. `apps/web/lib/google/gbp-client.ts` - Added retry logic
2. `apps/web/app/api/v1/locations/sync/route.ts` - Better error handling

## How to Test
1. Wait 5-10 minutes for Google's rate limit to reset
2. Click "Sync Locations" button in Settings → Integrations
3. System will automatically retry if rate limited
4. If still rate limited after retries, user sees helpful message

## Prevention
- Retry logic now handles transient rate limits automatically
- Exponential backoff prevents hammering the API
- Clear error messages guide users when manual wait is needed

## Google API Quotas (Reference)
- **My Business Account Management API**: 60 requests/minute/user
- **My Business Business Information API**: 60 requests/minute/user

To increase quotas:
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" → "Quotas"
3. Request quota increase (requires justification)

## Next Steps for User
1. **Wait 5-10 minutes** for rate limit to reset
2. Try "Sync Locations" again
3. If successful, locations will appear
4. Then click "Sync Reviews" for each location
