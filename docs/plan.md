# ReplyGenie MVP Implementation Plan

**North Star**: Draft → Approve → Post GBP review replies with Apple-grade UX and Netflix-grade engineering.

---

## Phase 0: Monorepo Setup & Design System (Day 0)

### 🤖 AI Code Editor Tasks

#### 0.1 Monorepo Scaffolding (pnpm + Turborepo)
- [ ] Initialize Turborepo workspace with pnpm
- [ ] Create folder structure:
  ```
  /apps
    /web            # Next.js App Router (UI + API)
  /extension        # Chrome MV3 (Vite/Plasmo or vanilla)
  /packages
    /shared         # zod types, constants, utils
    /api-contract   # shared endpoint types
    /sdk            # thin typed client for web+extension
  /infra
    /supabase       # SQL migrations + RLS scripts
    /ci             # GitHub Actions
  ```
- [ ] Configure `turbo.json` with build pipeline
- [ ] Set up shared `tsconfig.json` base
- [ ] Configure path aliases (`@repo/shared`, `@repo/sdk`, etc.)
- [ ] Add workspace dependencies in root `package.json`

#### 0.2 Apple-Inspired Design System
- [ ] Update `tailwind.config.ts` with Apple design tokens:
  - **Colors**: Apple Blue (HSL 211 100% 50%), pure white, deep charcoal
  - **Border Radius**: 12px (rounded-xl) for buttons/inputs, 16px (rounded-2xl) for cards
  - **Shadows**: Subtle shadow-sm, hover:shadow-md
  - **Typography**: Apple system font stack (-apple-system, SF Pro Display)
- [ ] Create design system components in `/packages/shared/components`:
  - `Button`: h-11, px-6, rounded-xl, shadow-sm, active:scale-[0.98]
  - `Card`: rounded-2xl, border-border/50, py-8, hover shadow transition
  - `Input`: h-11, rounded-xl, focus:ring-primary/20
- [ ] Enable font antialiasing in global CSS
- [ ] Add gradient backgrounds utility classes

#### 0.3 Shared Type Contracts (Zod)
- [ ] Create `/packages/api-contract/src/schemas.ts`:
  - `LocationSchema`, `ReviewSchema`, `DraftSchema`, `ReplySchema`
  - API request/response types for all endpoints
- [ ] Export TypeScript types from Zod schemas
- [ ] Set up barrel exports for easy imports

---

### 👤 User Manual Tasks

#### 0.M1 Install Turborepo
**Instructions:**
```bash
cd /Users/rohitgawli/Documents/GitHub/replygeniev2
pnpm add -D turbo
pnpm install
```

---

## Phase 1: Foundation & Authentication (Days 1-4)

### 🤖 AI Code Editor Tasks

#### 1.1 Database Schema & Migrations
- [x] Create Drizzle schema for all tables:
  - `rc_connections` (Google OAuth tokens, encrypted)
  - `rc_locations` (GBP locations with sync cursor)
  - `rc_reviews` (reviews with status tracking)
  - `rc_drafts` (AI-generated drafts with risk flags)
  - `rc_replies` (posted replies with audit trail)
  - `rc_usage` (monthly quota tracking)
  - `rc_audit_logs` (full audit trail)
- [x] Add indexes: `rc_reviews(location_id, review_create_time DESC)`, `rc_reviews(google_review_id)`, `rc_locations(google_location_id)`
- [x] Generate and test migrations (0001_rapid_kabuki.sql)
- [x] Add encryption utilities for storing refresh tokens (AES-256-GCM in lib/encryption.ts)

#### 1.2 Google OAuth Flow
- [x] Create `/api/google/oauth/start` endpoint (redirects to Google consent)
- [x] Create `/api/google/oauth/callback` endpoint (exchanges code, stores encrypted tokens)
- [x] Implement token refresh logic with expiry handling (lib/google/oauth.ts)
- [x] Add OAuth middleware for protected routes (middleware.ts)
- [x] Create connection status check utility (GET /api/v1/connection/status)

#### 1.3 Settings - Integrations Page (Apple Design)
- [x] Build `/apps/web/app/app/settings/integrations` route with:
  - **Apple-style layout**: Spacious padding (p-6 lg:p-12), gradient background
  - "Connect Google" button: rounded-xl, h-11, Apple Blue, shadow-sm, active:scale-[0.98]
  - Connection status: Clean badge with subtle border
  - Locations table: rounded-2xl cards with hover effects
  - "Sync Locations" button: Secondary style, rounded-xl
  - Per-location "Sync Reviews" button: Minimal, icon-only with tooltip
- [x] Implement Google My Business API client (lib/google/gbp-client.ts)
- [x] Add error handling with Apple-style toast notifications (subtle, top-center)
- [x] Empty state: Large icon, generous spacing, clear CTA

#### 1.4 Core API Endpoints (v1)
- [x] `GET /api/v1/health` → `{ ok: true, minClientVersion: "1.0.0" }`
- [x] `GET /api/v1/locations` → list all locations for org
- [x] `POST /api/v1/locations/sync` → sync locations from GBP
- [x] `POST /api/v1/reviews/sync` → fetch reviews from GBP, store new ones (lib/services/review-sync.ts)

---

### 👤 User Manual Tasks

#### 1.M1 Google Cloud Project Setup
**Instructions:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project named "ReplyBot"
3. Enable the following APIs:
   - Google My Business API
   - Google Business Profile API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen:
   - User Type: External
   - App name: ReplyGenie
   - Scopes: Add `https://www.googleapis.com/auth/business.manage`
6. Create OAuth 2.0 Client:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/google/oauth/callback` (dev) and your production URL
7. Copy **Client ID** and **Client Secret**

#### 1.M2 Environment Variables Setup
**Instructions:**
1. Create `.env` file in **root directory** (not in apps/web)
2. Add the following variables:
```env
# Google OAuth
GOOGLE_CLIENT_ID=<from step 1.M1>
GOOGLE_CLIENT_SECRET=<from step 1.M1>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback
BASE_URL=http://localhost:3000

# Database (already configured via docker-compose)
DATABASE_URL=<existing value>

# Encryption key for storing refresh tokens
TOKEN_ENCRYPTION_KEY=<generate 32-byte random string>
```
3. To generate `TOKEN_ENCRYPTION_KEY`, run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
4. **Note**: Use single root `.env` file. Next.js loads it via dotenv in next.config.ts

#### 1.M3 Database Setup
**Instructions:**
1. Ensure Docker is running
2. Start Postgres: `docker-compose up -d`
3. Run migrations: `pnpm drizzle-kit push`
4. Verify tables created: `pnpm drizzle-kit studio`

---

---

## ✅ Phase 1 Completed

**Status**: All Phase 1 tasks completed successfully.

**Key Deliverables**:
- Database schema with 7 new tables + encryption
- Google OAuth 2.0 flow with token refresh
- Settings → Integrations page with Apple-grade design
- API endpoints: health, locations, reviews sync, connection status
- Security: AES-256-GCM encryption, CSRF protection, RLS-ready
- Review sync service with incremental sync

**Routing Structure Fixed**:
- Renamed `app/(app)` → `app/app` for correct `/app/*` routes
- Removed `/app/general` route (not needed)
- Active routes: `/app/dashboard`, `/app/activity`, `/app/settings/*`
- Added redirect pages: `/app` → `/app/dashboard`, `/app/settings` → `/app/settings/integrations`

**Environment Configuration**:
- Single root `.env` file (removed duplicate apps/web/.env)
- Turborepo globalEnv configured for all environment variables
- Next.js loads root .env via dotenv in next.config.ts
- OAuth verified working with correct Client ID on port 3000

---

## ✅ Phase 2: Core Features - Inbox & Drafting (Days 5-10) - COMPLETED

### 🤖 AI Code Editor Tasks

#### 2.1 Review Sync Service
- [x] Implement `syncReviews(locationId)` function:
  - Fetch reviews from GBP API using stored tokens
  - Respect `sync_cursor` for incremental sync
  - Insert new reviews, skip existing (by `google_review_id`)
  - Update location's `sync_cursor` timestamp
  - Handle pagination for locations with many reviews
- [x] Add retry logic with exponential backoff for 429/5xx errors
- [x] Update `POST /api/v1/reviews/sync` to use service

#### 2.2 Inbox Page (Apple Design)
- [x] Build `/apps/web/app/app/inbox` with Apple aesthetics:
  - **Layout**: Spacious padding (p-6 lg:p-12), gradient background (white to gray-50/50)
  - **Filters**: Clean dropdown pills with rounded-xl, subtle borders
  - **Review cards**: rounded-2xl, generous padding (p-6), shadow-sm, hover:shadow-md
  - **Typography**: Semibold reviewer names, regular text, muted dates
  - **Draft preview**: Separate card with subtle background, rounded-xl
  - **Action buttons**: 
    - Primary "Generate Draft": Apple Blue, rounded-xl, h-11, shadow-sm
    - Secondary "Regenerate", "Edit": Outlined, rounded-xl
    - Success "Approve & Post": Green accent, rounded-xl, bold
  - **Transitions**: Smooth 200ms on all interactive elements
- [x] Implement filter logic with smooth animations
- [x] Empty state: Large icon (Lucide), 3xl heading, spacious layout
- [x] "Posted" badge: Green with checkmark icon, rounded-full, subtle shadow
- [x] Added Inbox to sidebar navigation (between Dashboard and Activity)

#### 2.3 AI Draft Generation Service
- [x] Create draft generation function with guardrails:
  - Max 90 words (≤600 chars)
  - Must reference one concrete detail from review
  - 4-5★: appreciative, specific, no fluff
  - ≤3★: apologize + acknowledge + invite to private channel
  - Same language as review (detect via library)
  - Sign-off: `— {LOCATION_NAME}`
  - Post-filter: strip URLs, mask profanity
- [x] Implement `POST /api/v1/drafts/:reviewId` endpoint
- [x] Store draft in `rc_drafts` with risk flags (JSONB)
- [x] Add "Regenerate" logic (delete old draft, generate new)
- [x] Using Gemini 2.0 Flash Exp for AI generation

#### 2.4 Brand Voice Settings (Apple Design)
- [x] Add `/apps/web/app/app/settings/brand-voice` with:
  - **Layout**: Centered, spacious (max-w-2xl mx-auto, p-6 lg:p-12)
  - **Textarea**: h-32, rounded-xl, focus:ring-primary/20, subtle background
  - **Input**: h-11, rounded-xl, clean placeholder text
  - **Labels**: Semibold, generous spacing (mb-3)
  - **Save button**: Apple Blue, rounded-xl, h-11, full-width on mobile
  - **Helper text**: Muted color, smaller font, below inputs
- [x] Store in `teams` table (`brand_voice_guidance` and `contact_channel` columns)
- [x] Pass brand voice to draft generation service
- [x] Add success toast with checkmark icon on save
- [x] Created tabbed settings layout with General, Integrations, Brand Voice tabs

#### 2.5 Approve & Post Service
- [x] Implement `postReply(reviewId, text)` function:
  - Post reply to GBP via API
  - Idempotent: check `rc_replies.review_id` UNIQUE constraint
  - Update `rc_reviews.replied = true`, `status = 'posted'`
  - Insert into `rc_replies` with `posted_by` (user ID)
  - Increment `rc_usage.posts_count` for current month
  - Create audit log entry in `rc_audit_logs`
- [x] Add retry logic for transient failures (exponential backoff)
- [x] Implement `POST /api/v1/replies/:reviewId` endpoint
- [x] Add quota check middleware (block if monthly limit exceeded)

#### 2.6 Dashboard Page (Apple Design)
- [x] Build `/apps/web/app/app/dashboard` with Apple aesthetics:
  - **Layout**: Spacious padding (p-6 lg:p-12), gradient background
  - **Heading**: 4xl-5xl, bold, generous spacing (mb-8)
  - **KPI Cards**: 
    - Grid layout (grid-cols-1 md:grid-cols-2, gap-6)
    - rounded-2xl, p-8, shadow-sm, hover:shadow-md
    - Large numbers (5xl-6xl, bold)
    - Muted labels (text-sm, uppercase, tracking-wide)
    - Icon with gradient background circle
  - **Recent Reviews Table**:
    - rounded-2xl card container
    - Clean table with hover row effects
    - Status badges with icons (rounded-full)
    - "View All" link to Inbox (Apple Blue, semibold)
  - **Empty state**: Large icon, 3xl heading, "Connect Google" CTA

#### 2.7 Quota System
- [x] Add quota middleware to check `rc_usage` before posting
- [x] Set default limit: 100 posts/month per org (configurable)
- [x] Return 429 error with clear message if exceeded
- [x] Add quota display in Settings/General page

#### 2.8 Settings/General Page
- [x] Create `/apps/web/app/app/settings/general` page with:
  - Organization information (name, created date, member count)
  - Connected locations display with verification status
  - Location details (address, phone, website, last sync)
  - Usage & limits section
- [x] Implement `GET /api/v1/settings/team-info` endpoint

---

### 👤 User Manual Tasks

#### 2.M1 AI Service Setup (OpenAI or Anthropic)
**Instructions:**
1. Choose AI provider:
   - **Option A: Gemini 2.5** (recommended for MVP)
     - Create API key

2. Add to `.env.local`:
```env
# Gemini
GEMINI_API_KEY=...


#### 2.M2 Test with Real GBP Location
**Instructions:**
1. Ensure you have a verified Google Business Profile location
2. If not, create one at [Google Business Profile](https://business.google.com/)
3. Verify the location (Google will send a postcard with code)
4. Add at least 2-3 test reviews (ask friends or use test accounts)
5. Connect the location in ReplyGenie Settings → Integrations
6. Click "Sync Reviews" to import reviews

#### 2.M3 Configure Brand Voice
**Instructions:**
1. Go to Settings → Brand Voice
2. Add tone guidance, e.g.:
   - "Friendly and professional. Use first-person plural (we, our)."
   - "Casual and warm. Emphasize community and local values."
3. Add contact channel for negative reviews, e.g.:
   - "Please call us at (555) 123-4567"
   - "Email us at support@yourbusiness.com"
4. Save settings

---

## Phase 3: Chrome Extension & Polish (Days 11-14)

### 🤖 AI Code Editor Tasks

#### 3.1 Extension Authentication
- [ ] Create `/api/extension/auth` endpoint:
  - Issues short-lived JWT (15 min expiry) for extension
  - Validates user session, returns JWT with `org_id`
- [ ] Add JWT verification middleware for extension API calls
- [ ] Implement token refresh flow in extension

#### 3.2 Chrome Extension (Manifest V3)
- [ ] Create `extension/` folder with:
  - `manifest.json` (MV3, permissions: `activeTab`, `storage`, host: `business.google.com`)
  - `content.js` (inject "Generate Draft" button on GBP review pages)
  - `background.js` (handle auth, API calls)
  - `popup.html` (login status, settings link)
- [ ] Content script logic:
  - Detect GBP review reply textarea (selector: `[data-review-id]` or similar)
  - Inject "Generate Draft" button next to textarea
  - On click: fetch draft from API, paste into textarea
  - Fallback: if selector fails, show "Open Inbox" link
- [ ] Add extension API endpoints:
  - `POST /api/extension/draft` (accepts review ID or review text)
  - Returns draft text
- [ ] Handle CORS: whitelist extension ID in API

#### 3.3 Extension Pairing Flow
- [ ] Add "Connect Extension" section in Settings → Integrations
- [ ] Generate pairing code (6-digit, 5-min expiry)
- [ ] Extension popup: "Enter pairing code" → exchanges for JWT
- [ ] Store JWT in extension's `chrome.storage.local`

#### 3.4 Audit Log Page (Optional but Recommended)
- [ ] Create `/audit` route with table:
  - Columns: Timestamp, Actor, Action, Review ID, Old/New values
  - Filter by date range, actor, action type
- [ ] Query `rc_audit_logs` with pagination

#### 3.5 RLS (Row-Level Security) Setup
- [ ] Add RLS policies to all tables:
  - Filter by `org_id` using `current_setting('app.org_id')`
  - Or use Supabase `auth.uid()` if using Supabase auth
- [ ] Add middleware to set `app.org_id` session variable on every request
- [ ] Write RLS tests:
  - Org A cannot read/write Org B data
  - Missing org var blocks all access

#### 3.6 Testing & Observability
- [ ] Write unit tests:
  - Draft guardrails (length, detail, negative script, filters)
  - Quota middleware
  - Idempotent posting
- [ ] Write integration tests:
  - OAuth flow (mock Google API)
  - Review sync (insert new, skip existing)
  - Post reply (updates DB + usage)
- [ ] Add E2E test (Playwright):
  - Connect → Sync → Generate → Approve & Post → Verify audit log
- [ ] Add structured logging (Winston or Pino)
- [ ] Add health check endpoint with DB connectivity test

#### 3.7 Error Handling & Edge Cases
- [ ] Already replied: disable Post button, show "Posted" badge
- [ ] Unverified location (403): show "Location not verified—cannot post"
- [ ] Rate limit (429): retry with backoff, show toast with retry hint
- [ ] Empty/long reviews: block or clamp, explain why
- [ ] Non-English reviews: maintain language, handle emojis/profanity

#### 3.8 Final Polish (Apple-Grade UX)
- [ ] **Loading states**: Apple-style spinners (subtle, centered, with blur backdrop)
- [ ] **Toasts**: Top-center, rounded-xl, shadow-lg, backdrop-blur, auto-dismiss
- [ ] **Empty states**: 
  - Large Lucide icons (size-16, muted color)
  - 3xl-4xl headings with generous spacing
  - Helpful descriptive text (text-muted-foreground)
  - Clear primary CTA button
- [ ] **Keyboard shortcuts**: 
  - `Cmd+Enter` to post (show hint in UI)
  - `Cmd+K` for command palette (optional)
  - Visual indicator on buttons ("⌘↵")
- [ ] **Mobile responsive**: 
  - Touch-friendly 44px minimum tap targets
  - Proper spacing on small screens
  - Collapsible sidebar on mobile
  - Bottom sheet for filters on mobile
- [ ] **Animations**: 
  - Page transitions with fade-in
  - Card hover effects (scale, shadow)
  - Button active states (scale-[0.98])
  - Smooth 200ms transitions throughout
- [ ] **Header**: Sticky with backdrop-blur-xl, minimal border, hover effects

---

### 👤 User Manual Tasks

#### 3.M1 Chrome Extension Packaging
**Instructions:**
1. Build extension: `cd extension && pnpm build` (if using bundler)
2. Load unpacked extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `extension/` folder
3. Pin extension to toolbar
4. Open extension popup, click "Connect to ReplyGenie"
5. Enter pairing code from web app Settings → Integrations

#### 3.M2 Extension Testing
**Instructions:**
1. Go to [Google Business Profile](https://business.google.com/)
2. Navigate to a review that needs a reply
3. Click "Reply" to open the reply textarea
4. Verify "Generate Draft" button appears next to textarea
5. Click button, verify draft is pasted
6. If button doesn't appear, verify fallback "Open Inbox" link works

#### 3.M3 Production Deployment Prep
**Instructions:**
1. Choose hosting provider:
   - **Recommended: Vercel** (Next.js optimized)
   - Alternative: Railway, Render, Fly.io
2. Set up production database:
   - **Recommended: Supabase** (Postgres + RLS built-in)
   - Alternative: Neon, PlanetScale, AWS RDS
3. Add production environment variables (same as `.env.local` but with prod values)
4. Update Google OAuth redirect URI to production URL
5. Deploy: `vercel deploy --prod` (or equivalent)

#### 3.M4 Chrome Web Store Submission (Optional for MVP)
**Instructions:**
1. Create developer account at [Chrome Web Store](https://chrome.google.com/webstore/devconsole/)
2. Pay one-time $5 registration fee
3. Prepare assets:
   - Icon: 128x128px PNG
   - Screenshots: 1280x800px or 640x400px (at least 1)
   - Promotional tile: 440x280px (optional)
4. Zip extension folder
5. Upload to Web Store, fill out listing details
6. Submit for review (typically 1-3 days)

#### 3.M5 Final Go/No-Go Checklist
**Instructions:**
Before launching, verify:
- [ ] Live reply posted to real, verified GBP location via web app
- [ ] Reply is visible publicly on Google
- [ ] Audit log entry created with correct actor and text
- [ ] Quota incremented in `rc_usage`
- [ ] Inbox shows "Posted" badge
- [ ] Extension generates draft on GBP page and pastes correctly
- [ ] RLS enabled and tenant isolation tests pass
- [ ] E2E test passes in CI
- [ ] Health endpoint returns 200
- [ ] Error handling works for 403, 429, 5xx
- [ ] No Google tokens in extension (only short-lived JWT)

---

## Success Metrics (Track Post-Launch)

- **Time-to-Reply median**: Target < 24h (measure via `rc_replies.posted_at - rc_reviews.review_create_time`)
- **Draft acceptance rate**: Target ≥ 70% for 4-5★ reviews (track edits vs. direct posts)
- **Coverage (30d)**: Target ≥ 80% of reviews replied (pilot locations)

---

## Rollback Plan

If posting degrades:
1. Feature-flag "Approve & Post" off → keep draft-only mode
2. Revert last deploy via hosting provider
3. DB is safe due to idempotent design (no data loss)

---

## Notes

- **AI Tasks**: Can be completed by AI code editor (Cascade, Cursor, etc.) with minimal human intervention
- **Manual Tasks**: Require human action (API keys, account setup, testing, deployment)
- **Timeline**: 2 weeks (10 working days) for MVP + Day 0 for setup
- **Scope Discipline**: If a feature doesn't help "draft → approve → post on GBP", it goes to parking lot
- **Design System**: All UI follows Apple design principles (see DESIGN_REFACTOR.md)
- **Monorepo**: Turborepo with pnpm workspaces for shared code and type safety

---

**End of Plan**
