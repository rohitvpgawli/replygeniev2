# Google Business Profile API Fix

**Date**: November 9, 2024  
**Issue**: 500 error when syncing locations

---

## Problem

The `/api/v1/locations/sync` endpoint was returning a 500 Internal Server Error when trying to sync locations from Google Business Profile.

### Root Cause

The code was using the deprecated Google My Business API v4 (`mybusiness.googleapis.com/v4`) for fetching accounts, which is no longer supported by Google.

---

## Solution

Updated `apps/web/lib/google/gbp-client.ts` to use the newer Google Business Profile API v1 (`mybusinessbusinessinformation.googleapis.com/v1`) for all endpoints.

### Changes Made

**Before**:
```typescript
export async function fetchAccounts(accessToken: string): Promise<GbpAccount[]> {
  const response = await fetch(`${GBP_API_BASE}/accounts`, {
    // GBP_API_BASE = 'https://mybusiness.googleapis.com/v4'
```

**After**:
```typescript
export async function fetchAccounts(accessToken: string): Promise<GbpAccount[]> {
  const response = await fetch(`${GBP_API_V1_BASE}/accounts`, {
    // GBP_API_V1_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1'
```

---

## API Endpoints Now Used

1. **Accounts**: `https://mybusinessbusinessinformation.googleapis.com/v1/accounts`
2. **Locations**: `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations`
3. **Reviews**: `https://mybusiness.googleapis.com/v4/{locationName}/reviews` (still v4 for reviews)
4. **Reply**: `https://mybusiness.googleapis.com/v4/{reviewName}/reply` (still v4 for replies)

**Note**: Reviews and replies still use v4 API as that's the current supported endpoint for those operations.

---

## Testing

After the fix:
1. ✅ OAuth connection works
2. ⏳ Click "Sync Locations" button
3. ⏳ Verify locations appear in the list
4. ⏳ Test syncing reviews for a location

---

## Status

- [x] Code fixed
- [x] Server automatically reloaded (Hot Module Replacement)
- [ ] User to test "Sync Locations" button
- [ ] Verify locations appear

---

**Next**: Try clicking "Sync Locations" again to see if it works now!
