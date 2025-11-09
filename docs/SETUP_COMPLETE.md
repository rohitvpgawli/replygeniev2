# Phase 1 Setup Complete! ✅

## What We Just Did

### 1. Generated Encryption Key
**Your TOKEN_ENCRYPTION_KEY:**
```
285c6fc11d926377dbf16c20bba73cc0b543b3df59f81f15fd0ae2144a0fc1e0
```

**⚠️ IMPORTANT:** Add this to your `.env` file:
```bash
TOKEN_ENCRYPTION_KEY=285c6fc11d926377dbf16c20bba73cc0b543b3df59f81f15fd0ae2144a0fc1e0
```

### 2. Database Setup ✅
- ✅ PostgreSQL container running (port 54322)
- ✅ Migrations applied successfully
- ✅ 12 tables created:
  - `users`, `teams`, `team_members`, `activity_logs`, `invitations`
  - `rc_connections`, `rc_locations`, `rc_reviews`, `rc_drafts`, `rc_replies`, `rc_usage`, `rc_audit_logs`

### 3. Drizzle Studio Running
- URL: https://local.drizzle.studio
- You can browse all tables and data here

---

## Final Checklist Before Testing

Make sure your `.env` file has these values:

```env
# Database
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Google OAuth (from Task 1.M1)
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback

# Encryption (COPY THIS!)
TOKEN_ENCRYPTION_KEY=285c6fc11d926377dbf16c20bba73cc0b543b3df59f81f15fd0ae2144a0fc1e0

# App
BASE_URL=http://localhost:3000
AUTH_SECRET=your-auth-secret

# Stripe (existing)
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

---

## Test Phase 1 Now!

### Start the dev server:
```bash
cd /Users/rohitgawli/Documents/GitHub/replygeniev2
pnpm dev
```

### Navigate to:
```
http://localhost:3000/dashboard/settings/integrations
```

### Expected Flow:
1. ✅ Click "Connect Google Business Profile"
2. ✅ Authorize with Google
3. ✅ Redirected back with success message
4. ✅ Click "Sync Locations"
5. ✅ Locations appear
6. ✅ Click "Sync Reviews" on a location
7. ✅ Reviews synced!

---

## Why TOKEN_ENCRYPTION_KEY?

**Q: Why can't we automate this?**

**A: Security & Persistence**
- We're storing Google OAuth tokens that give access to your customers' business profiles
- These MUST be encrypted in the database (security best practice)
- The key must persist across restarts (or all tokens become unreadable)
- In production with multiple servers, they all need the same key
- Auto-generating would cause data loss on every restart

**Think of it like:**
- Your database password - you don't auto-generate that either
- It's a one-time setup, stored in `.env`, never changes

---

## Database Commands Reference

```bash
# From /apps/web directory:

# Generate new migrations (after schema changes)
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Open Drizzle Studio (browse tables)
pnpm db:studio

# Seed database with test data
pnpm db:seed

# Setup database from scratch
pnpm db:setup
```

---

## Troubleshooting

### "No valid access token"
- Make sure you completed Task 1.M1 (Google Cloud setup)
- Check `.env` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### "Failed to encrypt tokens"
- Add `TOKEN_ENCRYPTION_KEY` to `.env` (see above)
- Restart dev server after adding

### Database connection errors
- Check PostgreSQL is running: `docker ps | grep postgres`
- Verify `POSTGRES_URL` in `.env` matches: `postgresql://postgres:postgres@localhost:54322/postgres`

---

## Next Steps

Once Phase 1 testing is successful:
- Proceed to **Phase 2: Inbox & AI Draft Generation**
- See `/docs/plan.md` for Phase 2 tasks

---

**Status:** ✅ Ready to test Phase 1!
