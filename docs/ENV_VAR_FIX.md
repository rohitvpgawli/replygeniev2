# Environment Variable Fix - GOOGLE_OAUTH_REDIRECT

**Date**: November 9, 2024  
**Issue**: OAuth configuration error due to incorrect environment variable name

---

## Problem

The codebase was using `GOOGLE_REDIRECT_URI` but the actual environment variable name is `GOOGLE_OAUTH_REDIRECT`.

This caused the error:
```json
{"error":"OAuth configuration error"}
```

---

## Solution Applied

Changed all occurrences of `GOOGLE_REDIRECT_URI` to `GOOGLE_OAUTH_REDIRECT` throughout the codebase.

### Files Updated

1. **`.env.example`** ✅
   - Changed `GOOGLE_REDIRECT_URI` to `GOOGLE_OAUTH_REDIRECT`

2. **`turbo.json`** ✅
   - Updated `globalEnv` array to use `GOOGLE_OAUTH_REDIRECT`

3. **`apps/web/app/api/google/oauth/start/route.ts`** ✅
   - Changed `process.env.GOOGLE_REDIRECT_URI` to `process.env.GOOGLE_OAUTH_REDIRECT`

4. **`apps/web/app/api/google/oauth/callback/route.ts`** ✅
   - Changed `process.env.GOOGLE_REDIRECT_URI` to `process.env.GOOGLE_OAUTH_REDIRECT`
   - Fixed syntax error (const declarations were inside URLSearchParams)

5. **`docs/plan.md`** ✅
   - Updated environment variable documentation

6. **`docs/TROUBLESHOOTING.md`** ✅
   - Updated all references in troubleshooting guide
   - Updated example `.env` configurations
   - Updated production deployment instructions

---

## Required User Action

**Add to your root `.env` file**:
```env
GOOGLE_OAUTH_REDIRECT=http://localhost:3000/api/google/oauth/callback
```

**Complete `.env` file should have**:
```env
# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres

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

---

## Verification Steps

1. ✅ Add `GOOGLE_OAUTH_REDIRECT` to root `.env` file
2. ✅ Verify Google Cloud Console has both redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (sign-in)
   - `http://localhost:3000/api/google/oauth/callback` (GBP integration)
3. ✅ Dev server restarted automatically
4. ⏳ Test OAuth connection in Settings → Integrations

---

## Status

- [x] Code updated
- [x] Documentation updated
- [x] Dev server restarted
- [ ] User to add `GOOGLE_OAUTH_REDIRECT` to `.env`
- [ ] User to test OAuth connection

---

**Next**: Once you add the environment variable, test the connection in Settings → Integrations!
