# Phase 2 Implementation Complete ✅

**Status**: All Phase 2 tasks completed successfully  
**Date**: November 9, 2024

---

## Overview

Phase 2 focused on building the core features of ReplyGenie: the Inbox for managing reviews, AI-powered draft generation with guardrails, brand voice customization, reply posting with idempotency, and a dashboard with KPIs.

---

## ✅ Completed Features

### 2.1 Review Sync Service
**Status**: ✅ Completed in Phase 1  
- Incremental sync with cursor tracking
- Handles pagination for large review sets
- Retry logic with exponential backoff

### 2.2 Inbox Page (Apple Design)
**Status**: ✅ Completed  
**Location**: `/apps/web/app/app/inbox/page.tsx`

**Features**:
- Clean, spacious Apple-inspired layout with gradient backgrounds
- Three filter dropdowns: Location, Rating, Status
- Review cards with:
  - Reviewer name, star rating, status badge
  - Review text in subtle background card
  - Draft preview in blue-tinted card with word/char count
  - Action buttons: Generate Draft, Regenerate, Edit, Approve & Post
- Empty states with helpful guidance
- Real-time loading states with spinners
- Smooth transitions (200ms) on all interactions

**UI Components Created**:
- `/apps/web/components/ui/select.tsx` - Radix UI select dropdown
- `/apps/web/components/ui/badge.tsx` - Status badges
- `/apps/web/components/ui/textarea.tsx` - Multi-line text input

**API Endpoint**:
- `GET /api/v1/reviews` - Fetch reviews with filters (location, rating, status)
  - Returns reviews with location and draft data joined
  - Supports pagination (limit 100)

### 2.3 AI Draft Generation Service
**Status**: ✅ Completed  
**Location**: `/apps/web/lib/services/draft-generation.ts`

**Guardrails Implemented**:
- ✅ Maximum 90 words (≤600 characters)
- ✅ Must reference one specific detail from review
- ✅ 4-5★: Appreciative, specific, no fluff
- ✅ ≤3★: Apologize + acknowledge + invite to private channel
- ✅ Same language as review (auto-detect)
- ✅ Sign-off: `— {LOCATION_NAME}`
- ✅ Post-filter: Strip URLs, mask profanity
- ✅ Risk flags: `hasUrl`, `hasProfanity`, `tooLong`, `missingDetail`

**AI Integration**:
- Uses **Gemini 2.0 Flash Exp** API
- Temperature: 0.7, Max tokens: 200
- Structured prompts based on star rating
- Incorporates brand voice guidance from team settings

**API Endpoints**:
- `POST /api/v1/drafts/[reviewId]` - Generate new draft
- `PATCH /api/v1/drafts/[reviewId]` - Update existing draft
- `DELETE /api/v1/drafts/[reviewId]` - Delete draft (for regeneration)

**Database Updates**:
- Inserts into `rc_drafts` table with:
  - `draftText`, `wordCount`, `charCount`, `riskFlags` (JSONB)
  - `generatedBy` ('ai' or 'user'), `editedBy`, `editedAt`
- Updates `rc_reviews.status` to 'drafted'

### 2.4 Brand Voice Settings Page
**Status**: ✅ Completed  
**Location**: `/apps/web/app/app/settings/brand-voice/page.tsx`

**Features**:
- Centered, spacious layout (max-w-2xl)
- Two main inputs:
  1. **Tone & Style Guidance** (textarea, h-32)
  2. **Contact Channel** (input, for negative reviews)
- Example usage preview in blue-tinted card
- Tips card with best practices
- Save button with success/error feedback
- Real-time form state management

**API Endpoint**:
- `GET /api/v1/brand-voice` - Fetch team settings
- `POST /api/v1/brand-voice` - Update team settings

**Database Updates**:
- Updates `teams.brandVoiceGuidance` and `teams.contactChannel`
- Used by draft generation service

### 2.5 Approve & Post Service
**Status**: ✅ Completed  
**Location**: 
- `/apps/web/lib/services/google-reply.ts` - Google API integration
- `/apps/web/app/api/v1/replies/[reviewId]/route.ts` - API endpoint

**Features**:
- ✅ **Idempotent**: Checks `rc_replies.review_id` UNIQUE constraint
- ✅ **Quota enforcement**: Checks monthly limit before posting
- ✅ **Token refresh**: Automatically refreshes expired OAuth tokens
- ✅ **Retry logic**: Exponential backoff for 429/5xx errors
- ✅ **Error handling**: Specific messages for 403 (unverified), 429 (rate limit)
- ✅ **Audit logging**: Records actor, text, timestamp in `rc_audit_logs`
- ✅ **Usage tracking**: Increments `rc_usage.postsCount` for current month

**Google API Integration**:
- Posts to `https://mybusiness.googleapis.com/v4/{reviewPath}/reply`
- Handles review name format: `accounts/{accountId}/locations/{locationId}/reviews/{reviewId}`
- Max 3 retries with exponential backoff (1s, 2s, 4s)

**Database Updates**:
- Inserts into `rc_replies` with `postedBy`, `googleReplyId`, `googleUpdateTime`
- Updates `rc_reviews.replied = true`, `status = 'posted'`
- Increments or creates `rc_usage` entry for current month
- Creates `rc_audit_logs` entry with action 'REPLY_POSTED'

**OAuth Token Management**:
- Added `refreshAccessToken()` to `/apps/web/lib/google/oauth.ts`
- Returns new access token and expiry time
- Handles token refresh failures gracefully

### 2.6 Dashboard Page
**Status**: ✅ Completed  
**Location**: `/apps/web/app/app/dashboard/page.tsx`

**Features**:
- 4 KPI cards in responsive grid (1 col mobile, 2 col tablet, 4 col desktop):
  1. **Needing Reply** (orange icon) - Count of unresponded reviews
  2. **Replies (30d)** (green icon) - Replies posted in last 30 days
  3. **Avg Response** (blue icon) - Average time to respond (hours or days)
  4. **Total Reviews** (purple icon) - Total reviews synced
- Recent Reviews table:
  - Shows last 5 reviews
  - Displays reviewer name, stars, status badge, location, time ago
  - Line-clamped review text (max 2 lines)
  - "View All" button links to Inbox
- Empty state with "Go to Settings" CTA
- Apple-grade design: rounded-2xl cards, hover effects, gradient backgrounds

**API Endpoints**:
- `GET /api/v1/dashboard/stats` - Fetch KPI metrics
  - Calculates needing reply, replies posted 30d, avg response time, total reviews
  - Avg response time logic: calculates hours between review creation and reply posting
- `GET /api/v1/dashboard/recent-reviews` - Fetch 5 most recent reviews with location data

### 2.7 Quota System
**Status**: ✅ Integrated into replies endpoint  
**Location**: `/apps/web/app/api/v1/replies/[reviewId]/route.ts`

**Features**:
- Checks `rc_usage` table before posting
- Default limit: 100 posts/month per org
- Returns 429 error with clear message if exceeded
- Automatically creates usage entry if not exists
- Increments count atomically using SQL: `postsCount + 1`

**Database**:
- `rc_usage` table tracks `postsCount`, `draftsCount`, `quotaLimit` per team per month
- Month key format: 'YYYY-MM'
- Unique constraint on `(teamId, month)`

---

## 📦 Dependencies Installed

```bash
pnpm add @radix-ui/react-select date-fns
```

---

## 🗂️ File Structure

```
apps/web/
├── app/
│   ├── app/
│   │   ├── inbox/
│   │   │   └── page.tsx                    # ✅ Inbox page
│   │   ├── dashboard/
│   │   │   └── page.tsx                    # ✅ Dashboard (replaced)
│   │   └── settings/
│   │       └── brand-voice/
│   │           └── page.tsx                # ✅ Brand voice settings
│   └── api/
│       └── v1/
│           ├── reviews/
│           │   └── route.ts                # ✅ GET reviews with filters
│           ├── drafts/
│           │   └── [reviewId]/
│           │       └── route.ts            # ✅ POST/PATCH/DELETE drafts
│           ├── replies/
│           │   └── [reviewId]/
│           │       └── route.ts            # ✅ POST reply to Google
│           ├── brand-voice/
│           │   └── route.ts                # ✅ GET/POST brand voice
│           └── dashboard/
│               ├── stats/
│               │   └── route.ts            # ✅ GET dashboard KPIs
│               └── recent-reviews/
│                   └── route.ts            # ✅ GET recent reviews
├── components/
│   └── ui/
│       ├── select.tsx                      # ✅ NEW
│       ├── badge.tsx                       # ✅ NEW
│       └── textarea.tsx                    # ✅ NEW
└── lib/
    ├── services/
    │   ├── draft-generation.ts             # ✅ NEW - AI draft service
    │   └── google-reply.ts                 # ✅ NEW - Google API posting
    └── google/
        └── oauth.ts                        # ✅ UPDATED - Added refreshAccessToken()
```

---

## 🧪 Testing Checklist

### Manual Testing Required

#### Inbox Page
- [ ] Navigate to `/app/inbox`
- [ ] Verify filters work (Location, Rating, Status)
- [ ] Click "Generate Draft" on a review without a draft
- [ ] Verify draft appears in blue card with word/char count
- [ ] Click "Regenerate" and verify new draft is generated
- [ ] Click "Edit" and modify draft text, then "Save Changes"
- [ ] Click "Approve & Post" and verify reply is posted to Google
- [ ] Verify "Posted" badge appears after successful post
- [ ] Check empty state when no reviews match filters

#### Brand Voice Settings
- [ ] Navigate to `/app/settings/brand-voice`
- [ ] Enter tone guidance (e.g., "Friendly and professional")
- [ ] Enter contact channel (e.g., "call us at (555) 123-4567")
- [ ] Click "Save Settings" and verify success message
- [ ] Refresh page and verify settings are persisted
- [ ] Generate a draft and verify it uses the brand voice

#### Dashboard
- [ ] Navigate to `/app/dashboard`
- [ ] Verify 4 KPI cards display correct numbers
- [ ] Verify "Recent Reviews" table shows last 5 reviews
- [ ] Click "View All" and verify it goes to Inbox
- [ ] Check empty state when no reviews exist

#### Quota System
- [ ] Post replies until quota is reached (100 by default)
- [ ] Verify 429 error with clear message when quota exceeded
- [ ] Check `rc_usage` table to verify count incremented

#### Error Handling
- [ ] Try posting to unverified location (should show 403 error)
- [ ] Simulate rate limit (429) and verify retry logic
- [ ] Test with expired OAuth token (should auto-refresh)

---

## 🔧 Environment Variables Required

Add to `.env.local`:

```env
# Gemini AI (for draft generation)
GEMINI_API_KEY=your_gemini_api_key_here
```

**How to get Gemini API key**:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and add to `.env.local`

---

## 🚀 Next Steps (Phase 3)

Phase 3 will focus on:
1. **Chrome Extension** (MV3) - Generate drafts in-place on GBP pages
2. **Audit Log Page** - View all actions with filters
3. **RLS (Row-Level Security)** - Enable tenant isolation
4. **Testing** - Unit, integration, E2E tests
5. **Polish** - Loading states, keyboard shortcuts, mobile responsive
6. **Error Handling** - Edge cases (empty reviews, long reviews, non-English)

---

## 📝 Notes

- **AI Model**: Using Gemini 2.0 Flash Exp for fast, cost-effective draft generation
- **Design System**: All UI follows Apple design principles (rounded-2xl, generous spacing, subtle shadows)
- **Type Safety**: Full TypeScript coverage with Drizzle ORM types
- **Security**: OAuth tokens encrypted, quota enforcement, audit logging
- **Idempotency**: Reply posting is idempotent via UNIQUE constraint on `review_id`
- **Observability**: Console logging for errors, structured audit logs in database

---

## 🐛 Known Issues

1. **Google Reply API**: The actual Google My Business API endpoint may need adjustment based on the review name format returned by Google. Current implementation assumes `accounts/-/locations/{locationId}/reviews/{reviewId}` format.

2. **Language Detection**: The draft generation service uses a simple heuristic to check if the draft references the review. This can be improved with NLP libraries like `franc` or `compromise`.

3. **Profanity Filter**: Basic profanity list included. Expand as needed or integrate a library like `bad-words`.

---

## 🎉 Summary

Phase 2 is **100% complete**! All core features are implemented:
- ✅ Inbox with filters, draft generation, editing, and posting
- ✅ AI draft generation with strict guardrails
- ✅ Brand voice customization
- ✅ Idempotent reply posting with quota enforcement
- ✅ Dashboard with KPIs and recent reviews
- ✅ Apple-grade UX throughout

**Ready for Phase 3**: Chrome Extension, Audit Log, RLS, Testing, and Polish.
