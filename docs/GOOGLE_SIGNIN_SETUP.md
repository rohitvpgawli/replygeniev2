# Google Sign-In Setup Guide

## Overview

ReplyGenie now supports **two types of Google OAuth**:

1. **Google Sign-In** - For user authentication (sign up/sign in)
2. **Google Business Profile OAuth** - For accessing customer's business data

Both use the same Google OAuth Client ID and Secret, but different redirect URIs and scopes.

---

## Setup Instructions

### 1. Add Second Redirect URI in Google Cloud Console

You already have one redirect URI for GBP integration. Now add a second one for sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your "ReplyGenie" project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
6. Click **Save**

**You should now have TWO redirect URIs:**
- `http://localhost:3000/api/auth/google/callback` ← Sign-in
- `http://localhost:3000/api/google/oauth/callback` ← GBP integration

### 2. Update OAuth Consent Screen Scopes

Make sure these scopes are enabled:

**For Sign-In:**
- `userinfo.email`
- `userinfo.profile`

**For GBP Integration:**
- `business.manage`

**How to check:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Click **Edit App**
3. Go to **Scopes** section
4. Verify all three scopes are added
5. Click **Save and Continue**

---

## How It Works

### Sign-In Flow

```
User clicks "Sign in with Google"
    ↓
Redirects to: /api/auth/google/signin
    ↓
Google OAuth consent screen (email, profile access)
    ↓
Redirects to: /api/auth/google/callback
    ↓
Creates user account (if new) or signs in (if existing)
    ↓
Creates team and team membership
    ↓
Sets session cookie
    ↓
Redirects to: /dashboard
```

### GBP Integration Flow

```
User clicks "Connect Google Business Profile" (in Settings)
    ↓
Redirects to: /api/google/oauth/start
    ↓
Google OAuth consent screen (business.manage access)
    ↓
Redirects to: /api/google/oauth/callback
    ↓
Stores encrypted OAuth tokens in rc_connections table
    ↓
Redirects to: /dashboard/settings/integrations?success=connected
```

---

## Key Differences

| Feature | Sign-In OAuth | GBP Integration OAuth |
|---------|---------------|----------------------|
| **Purpose** | User authentication | Access business data |
| **Scopes** | `userinfo.email`, `userinfo.profile` | `business.manage` |
| **Redirect URI** | `/api/auth/google/callback` | `/api/google/oauth/callback` |
| **Token Storage** | Session cookie only | Encrypted in database |
| **Refresh Token** | Not needed | Yes (for long-term access) |
| **When Used** | Sign up / Sign in pages | Settings → Integrations |

---

## Testing

### Test Sign-In Flow

1. Start dev server: `pnpm dev`
2. Go to: `http://localhost:3000/sign-in`
3. Click **"Sign in with Google"** button
4. Authorize with Google
5. Should redirect to `/dashboard`
6. Verify you're signed in

### Test Sign-Up Flow

1. Go to: `http://localhost:3000/sign-up`
2. Click **"Sign up with Google"** button
3. Authorize with Google
4. Should create new account and redirect to `/dashboard`
5. Check database:
   - New user in `users` table
   - New team in `teams` table
   - New membership in `team_members` table

### Test GBP Integration (Existing)

1. Sign in first (using email/password or Google)
2. Go to: `/dashboard/settings/integrations`
3. Click **"Connect Google Business Profile"**
4. Authorize business access
5. Should redirect back with success message
6. Check database:
   - New entry in `rc_connections` table with encrypted tokens

---

## UI Changes

### Sign-In Page

**Before:**
- Email input
- Password input
- Sign in button

**After:**
- Email input
- Password input
- Sign in button
- **"Or continue with"** divider
- **"Sign in with Google"** button ← NEW
- Account switch link

### Sign-Up Page

Same changes as sign-in page, but button says **"Sign up with Google"**

---

## Security Notes

### OAuth Users (No Password)

Users who sign up with Google:
- Have `passwordHash = ''` in database
- Cannot sign in with email/password
- Must use "Sign in with Google" button

### Session Management

- Google Sign-In creates a session cookie (24-hour expiry)
- Session contains user ID only
- No Google tokens stored in session
- Session is HTTP-only, secure, SameSite=lax

### Token Storage

- **Sign-In:** No tokens stored (one-time use)
- **GBP Integration:** Tokens encrypted and stored in `rc_connections`

---

## Error Handling

The sign-in flow handles these errors:

| Error | Cause | User Message |
|-------|-------|--------------|
| `oauth_denied` | User denied access | "OAuth access was denied" |
| `invalid_request` | Missing code/state | "Invalid OAuth request" |
| `invalid_state` | CSRF check failed | "Invalid state parameter" |
| `token_exchange_failed` | Google API error | "Failed to exchange token" |
| `userinfo_failed` | Can't fetch user info | "Failed to get user information" |
| `email_not_verified` | Email not verified | "Email not verified with Google" |
| `no_team` | User has no team | "No team found" |
| `server_error` | Server error | "Server error occurred" |

Errors are shown as query parameters: `/sign-in?error=oauth_denied`

---

## Production Deployment

### Update Redirect URIs

When deploying to production:

1. Go to Google Cloud Console
2. Add production redirect URIs:
   ```
   https://yourdomain.com/api/auth/google/callback
   https://yourdomain.com/api/google/oauth/callback
   ```
3. Update `.env` with production `BASE_URL`

### OAuth Consent Screen

For production:
1. Submit app for verification (if using sensitive scopes)
2. Add privacy policy URL
3. Add terms of service URL
4. Remove test users (allow all users)

---

## Troubleshooting

### "Redirect URI mismatch"

**Problem:** Google shows error about redirect URI

**Solution:**
- Check both URIs are added in Google Cloud Console
- Verify exact match (no trailing slashes)
- Clear browser cache and try again

### "Email not verified"

**Problem:** User's Google email is not verified

**Solution:**
- User must verify their email with Google first
- Or use email/password sign-in instead

### "No team found"

**Problem:** Existing user has no team membership

**Solution:**
- This shouldn't happen for new users
- For existing users, manually create team membership in database

### User created but can't sign in with password

**Problem:** User signed up with Google, now trying email/password

**Solution:**
- OAuth users have no password
- Must use "Sign in with Google" button
- Or reset password (if you implement that feature)

---

## Database Schema Impact

### Users Table

OAuth users have:
```sql
email: user@gmail.com
name: John Doe
passwordHash: '' -- Empty for OAuth users
role: owner
```

### No New Tables

Google Sign-In doesn't require new tables. It uses existing:
- `users` - Store user account
- `teams` - Store user's team
- `team_members` - Link user to team

---

## Future Enhancements

Potential improvements (not in MVP):

- [ ] Link Google account to existing email/password account
- [ ] Allow users to set password after OAuth sign-up
- [ ] Support multiple OAuth providers (GitHub, Microsoft, etc.)
- [ ] Remember user's preferred sign-in method
- [ ] Show "Connected with Google" badge in profile

---

## Summary

✅ **Added:** "Sign in with Google" button on sign-in and sign-up pages

✅ **Created:** 2 new API endpoints for Google Sign-In OAuth

✅ **Updated:** `.env.example` with callback URL documentation

✅ **Separate:** Sign-In OAuth is completely separate from GBP OAuth

✅ **Secure:** No passwords stored for OAuth users, session-based auth

✅ **Ready:** Can test after completing Phase 1 manual tasks

---

**Status:** ✅ Google Sign-In feature complete and ready for testing!
