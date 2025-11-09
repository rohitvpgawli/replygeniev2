# Phase 1 Manual Tasks - Quick Reference

Complete these tasks before testing Phase 1 functionality.

## Task 1.M1: Google Cloud Project Setup

### Step-by-Step Instructions

1. **Create Google Cloud Project**
   - Go to: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"
   - Project name: `ReplyGenie`
   - Click "Create"

2. **Enable Required APIs**
   - In the project, go to "APIs & Services" → "Library"
   - Search and enable:
     - ✅ Google My Business API
     - ✅ Google Business Profile API

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: **External**
   - Click "Create"
   - Fill in:
     - App name: `ReplyGenie`
     - User support email: [your email]
     - Developer contact: [your email]
   - Click "Save and Continue"
   - **Scopes:** Click "Add or Remove Scopes"
     - Add: `https://www.googleapis.com/auth/business.manage`
   - Click "Save and Continue"
   - **Test users:** Add your Google account email
   - Click "Save and Continue"

4. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: `ReplyGenie Web`
   - **Authorized redirect URIs:**
     - Development: `http://localhost:3000/api/google/oauth/callback`
     - Production (later): `https://yourdomain.com/api/google/oauth/callback`
   - Click "Create"
   - **SAVE THESE VALUES:**
     - Client ID: `xxxxx.apps.googleusercontent.com`
     - Client Secret: `xxxxx`

---

## Task 1.M2: Environment Variables Setup

1. **Copy environment file**
   ```bash
   cd /Users/rohitgawli/Documents/GitHub/replygeniev2
   cp .env.example .env
   ```

2. **Generate encryption key**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output (64-character hex string)

3. **Edit `.env` file**
   Open `.env` and update:
   
   ```env
   # Google OAuth (from Task 1.M1)
   GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-actual-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
   
   # Encryption key (from step 2 above)
   TOKEN_ENCRYPTION_KEY=your-generated-64-char-hex-string
   
   # AI Service (for Phase 2 - optional for now)
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```

4. **Verify other variables**
   Make sure these are already set:
   - `POSTGRES_URL` (should be set from initial setup)
   - `BASE_URL=http://localhost:3000`
   - `AUTH_SECRET` (should be set from initial setup)

---

## Task 1.M3: Database Setup

1. **Ensure Docker is running**
   ```bash
   # Check if Docker is running
   docker ps
   ```
   If not running, start Docker Desktop

2. **Start PostgreSQL**
   ```bash
   cd /Users/rohitgawli/Documents/GitHub/replygeniev2
   docker-compose up -d
   ```

3. **Run database migrations**
   ```bash
   cd apps/web
   pnpm drizzle-kit push
   ```
   
   Expected output:
   ```
   ✓ Applying migrations...
   ✓ 12 tables created
   ```

4. **Verify database (optional)**
   ```bash
   pnpm drizzle-kit studio
   ```
   This opens a web UI at `https://local.drizzle.studio` to browse tables

---

## Verification Checklist

Before testing, verify:

- [ ] Google Cloud project created
- [ ] Google My Business API enabled
- [ ] Google Business Profile API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Client ID and Secret saved
- [ ] `.env` file created from `.env.example`
- [ ] `GOOGLE_CLIENT_ID` set in `.env`
- [ ] `GOOGLE_CLIENT_SECRET` set in `.env`
- [ ] `TOKEN_ENCRYPTION_KEY` generated and set
- [ ] Docker running
- [ ] PostgreSQL container started
- [ ] Database migrations applied
- [ ] All 12 tables visible in database

---

## Test Phase 1

Once all tasks complete:

```bash
# Start development server
cd /Users/rohitgawli/Documents/GitHub/replygeniev2
pnpm dev
```

Navigate to: `http://localhost:3000/dashboard/settings/integrations`

### Expected Flow:
1. ✅ Page loads with "Connect Google Business Profile" button
2. ✅ Click button → redirects to Google OAuth
3. ✅ Authorize → redirects back with success message
4. ✅ "Connected" badge appears
5. ✅ "Sync Locations" button visible
6. ✅ Click "Sync Locations" → locations appear
7. ✅ Click "Sync Reviews" on a location → reviews synced

---

## Troubleshooting

### "OAuth configuration error"
- Check `.env` has `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Restart dev server after changing `.env`

### "Redirect URI mismatch"
- Verify redirect URI in Google Cloud Console matches exactly:
  `http://localhost:3000/api/google/oauth/callback`

### "Database connection failed"
- Check Docker is running: `docker ps`
- Check PostgreSQL container: `docker-compose ps`
- Verify `POSTGRES_URL` in `.env`

### "No refresh token received"
- In Google Cloud Console, OAuth consent screen must be in "Testing" mode
- Add your email as a test user
- Use `prompt=consent` in OAuth URL (already implemented)

### "Failed to encrypt tokens"
- Verify `TOKEN_ENCRYPTION_KEY` is exactly 64 hex characters
- Regenerate if needed: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Next Steps

After successful Phase 1 testing:
- Proceed to **Phase 2: Core Features - Inbox & Drafting**
- See `/docs/plan.md` for Phase 2 tasks

---

**Need Help?**
- Check `/docs/PHASE1_COMPLETE.md` for implementation details
- Review `/docs/plan.md` for full plan
- Check console logs for detailed error messages
