PRD.md — Google Review-Reply Copilot (Web + Chrome Extension)
Name: ReplyGenie

North Star: Draft → Approve → Post Google Business Profile (GBP) review replies with Apple-grade UX and Netflix-grade engineering. MVP only. GBP-only, no feature bloat.

⸻

0) Glossary
	•	GBP: Google Business Profile
	•	Org: Tenant (agency or brand)
	•	Location: A single GBP location under an Org
	•	Draft: AI-generated reply suggestion
	•	Reply: Posted response on GBP

⸻

PRD — Google Review-Reply Copilot (Web + Chrome Extension)

Amazon “Working Backwards” PRFAQ — concise & MVP-focused

⸻

1) Press Release

FOR IMMEDIATE RELEASE — [Future Date] — Remote

Today we launched Review Copilot, a simple tool that drafts, lets you approve, and posts Google Business Profile (GBP) review replies in minutes. It includes a clean web dashboard and a Chrome extension that generates a draft directly inside the GBP reply box.

Small businesses and agencies spend hours replying to reviews. Review Copilot makes it three clicks: Sync → Draft → Post. Replies are concise, policy-safe, and match your tone. An audit log records who posted what and when.

Available today: web app (control center) + Chrome extension (in-place draft). GBP only at launch to keep it fast and reliable.

Learn more at [placeholder.com]

⸻

2) Customer Experience (1-paragraph narrative)

A business owner connects Google, selects a location, taps Sync Reviews, opens Inbox, clicks Generate to see a short, specific draft, edits if needed, then Approve & Post. A “Posted” badge appears, the reply is live on Google, and the audit log captures it. The Chrome extension adds a Generate Draft button directly on GBP pages for quick drafting in place.

⸻

3) Tenets (non-negotiable)
	1.	One Job Only: Draft → Approve → Post GBP replies. No bloat.
	2.	Apple-grade UX: calm layout, one primary action per screen, clear empty/error states.
	3.	Netflix-grade Engineering: typed contracts, idempotent posting, retries/backoff, observability.
	4.	Security First: Google tokens never leave server; RLS tenant isolation.
	5.	Policy-Safe by Design: ≤90 words, concrete detail, safe behavior for low ratings, no links/coupons/PII.

⸻

4) Who Is the Customer?
	•	Primary: SMB owners/managers of a single or few GBP locations.
	•	Secondary: Digital marketing agencies managing 10–50+ locations.

⸻

5) FAQs (external → internal)

Q1. What problem do you solve?
Owners waste hours replying to reviews; tone and timeliness are inconsistent. We compress it to three clicks with on-brand, policy-safe drafts.

Q2. Why GBP-only at launch?
It’s the highest-impact surface and avoids scope creep and partner gating. Reliability beats breadth for MVP.

Q3. Why both web and extension?
Web app is the source of truth (auth, tokens, quotas, audit). The extension is a convenience layer for in-place drafting in GBP UI.

Q4. Can it auto-post?
Not in MVP. Only manual Approve & Post from web. (Auto-post is post-MVP.)

Q5. How are drafts kept safe and non-generic?
Hard guardrails: max length, must reference one concrete review detail, safe script for ≤3★, same language, profanity/URL filters, consistent sign-off.

Q6. What about Yelp/FB/Tripadvisor?
Out of scope for MVP. Consider later once core usage is proven.

Q7. How do agencies use it?
They connect multiple locations, process reviews from the Inbox, and rely on the audit log. (White-label, bulk actions: post-MVP.)

Q8. How do you handle privacy/security?
Google refresh tokens stored encrypted server-side; extension holds only short-lived app JWT. RLS isolates org data.

Q9. What happens on API rate limits or unverified locations?
Clear, actionable UI error; server retries with backoff for 429/5xx; 403/unverified surfaces a specific message.

⸻

6) MVP Scope (In/Out)

In
	•	GBP OAuth, accounts/locations import
	•	Incremental Review Sync (manual trigger)
	•	AI Draft (server) with guardrails
	•	Inbox: Generate/Regenerate, Edit, Approve & Post (server → GBP)
	•	Audit log (actor, text snapshot, timestamps)
	•	Quotas (posts/month per org; billing toggle off)
	•	Dashboard: 2 KPIs (Needing Reply, Replies Posted 30d)
	•	Chrome MV3 extension: Generate Draft + paste only
	•	RLS tenant isolation (enabled at end; tested)

Out (MVP)
	•	Auto-post, translations, mobile apps, bulk actions, advanced RBAC, charts beyond 2 KPIs, non-GBP integrations.

⸻

7) UX Routes (Next.js App Router)

Shell: Left sidebar (Dashboard, Inbox, Activity, Settings); slim header.
	•	/app/dashboard — 4 KPI cards (Needing Reply, Replies 30d, Avg Response, Total Reviews); table of recent 5 reviews.
	•	/app/inbox — filters (Location, Rating, Status); rows with review snippet + draft; actions: Generate/Regenerate, Edit, Approve & Post.
	•	/app/activity — audit log of all actions (posted replies, edits, etc.)
	•	/app/settings — tabbed layout with General, Integrations, Brand Voice
	•	/general: Organization info, connected locations with verification status, usage & limits
	•	/integrations: Connect Google, Locations table (per-row Sync Reviews), Sync Locations
	•	/brand-voice: Tone guidance, contact channel for negative reviews
	•	/security: Password management, account deletion
	•	/app → redirects to /app/dashboard
	•	/app/settings → redirects to /app/settings/general
	•	/sign-in, /sign-up — authentication pages

Extension (MV3): On https://business.google.com/* inject Generate Draft button; paste into reply box. If selector fails, show “Open Inbox” link.

⸻

8) API (v1) — Minimal Contracts
	•	GET /api/v1/health → { ok: true, minClientVersion: "1.0.0" }
	•	GET /api/v1/locations → [{ id, name, googleLocationId, isVerified, ... }]
	•	GET /api/v1/reviews?locationId&rating&status → [{ review, location, draft }]
	•	POST /api/v1/reviews/sync { locationId } → { newReviews, totalReviews }
	•	POST /api/v1/drafts/:reviewId → { draft, message }
	•	PATCH /api/v1/drafts/:reviewId { text } → { draft, message }
	•	DELETE /api/v1/drafts/:reviewId → { message }
	•	POST /api/v1/replies/:reviewId { text } → { reply, message }
	•	GET/POST /api/v1/brand-voice → { brandVoiceGuidance, contactChannel }
	•	GET /api/v1/dashboard/stats → { needingReply, repliesPosted30d, avgResponseTime, totalReviews }
	•	GET /api/v1/dashboard/recent-reviews → [{ review, location }]
	•	GET /api/v1/settings/team-info → { name, createdAt, memberCount }

Google OAuth
	•	GET /api/google/oauth/start → redirects to Google
	•	GET /api/google/oauth/callback → exchanges code; stores tokens; imports locations

⸻

9) Data Model (Postgres)
	•	rc_connections: (id, org_id, provider='google', access_token, refresh_token, expiry, scopes[])
	•	rc_locations: (id, org_id, google_account_id, google_location_id UNIQUE, display_name, sync_cursor TIMESTAMPTZ)
	•	rc_reviews: (id, org_id, location_id, google_review_id UNIQUE, rating, reviewer_name, review_text, review_create_time, replied BOOL, reply_update_time, status ENUM('new','drafted','posted'))
	•	rc_drafts: (id, org_id, review_id UNIQUE, text, risk_flags JSONB, generated_at)
	•	rc_replies: (id, org_id, review_id UNIQUE, text, posted_at, posted_by, provider_reply_update_time)
	•	rc_usage: (org_id, month_key 'YYYY-MM', posts_count, drafts_count, PK(org_id, month_key))
	•	rc_audit_logs: (id, org_id, actor_user_id, action, review_id, old_value JSONB, new_value JSONB, ts)

Indexes:
	•	rc_reviews(location_id, review_create_time DESC)
	•	rc_reviews(google_review_id)
	•	rc_locations(google_location_id)

⸻

10) Drafting Rules (server-enforced)
	•	≤ 90 words (≤600 chars)
	•	Must reference one concrete detail from the review
	•	4–5★: appreciative, specific, no fluff
	•	≤3★: apologize + acknowledge issue + invite to private channel; no links/coupons/PII
	•	Same language as review (auto-detect); fallback neutral English
	•	Sign-off: — {LOCATION_NAME}
	•	Post-filter: strip URLs, mask profanity, enforce length

⸻

11) Security & RLS
	•	Google refresh tokens encrypted at rest; rotate access tokens; tokens never in extension
	•	Extension uses short-lived app JWT only
	•	CORS restricted to app origin + extension ID
	•	Idempotent posting: rc_replies.review_id UNIQUE; retries with backoff
	•	Full audit on every post/delete

RLS (enable at end)
	•	Option A (Supabase auth.uid()): policies filter by org_id via user→org mapping
	•	Option B (pure Postgres): SET LOCAL app.org_id = '<uuid>' + policies using current_setting('app.org_id')
	•	Tests: Org A cannot read/write Org B; missing org var blocks access

⸻

12) Metrics & Alarms

Success Metrics
	•	Time-to-Reply median ↓ to < 24h (pilot)
	•	Draft acceptance ≥ 70% for 4–5★ (dogfood)
	•	Coverage (30d) ≥ 80% for pilot locations

Alarms
	•	GBP error rate > 2% over 15m
	•	Draft generation > 5s p95 over 15m
	•	Queue depth > threshold for 10m

⸻

13) Edge Cases (explicit)
	•	Already replied → disable Post; show “Posted” badge
	•	Unverified location (403) → “Location not verified—cannot post”
	•	429/5xx → retry with exponential backoff; toast shows retry hint
	•	Empty / extremely long reviews → block or clamp; explain why
	•	Non-English, emojis, profanity → handle gracefully; maintain language

⸻

14) Test Plan (Double/Triple-Check)

Unit
	•	Guardrails (length, detail presence, negative triad, URL/profanity filters)
	•	Quota middleware; idempotent posting

Integration
	•	OAuth exchange + token refresh
	•	Review sync: insert new, ignore seen; checkpoint respected
	•	GBP post success updates DB + usage; 403/429 paths validated

RLS
	•	Cross-org isolation (read/write) + missing org var blocked

E2E (golden path)
	•	Connect → Import location → Sync → Generate → Approve & Post → Reply live on Google → Audit row created

Extension QA
	•	Button appears; pastes draft; fallback link works if selector fails

⸻

15) Implementation Status

Phase 1 (Foundation & Authentication) — ✅ COMPLETED
	•	Database schema: 7 tables created with proper indexes and encryption
	•	Google OAuth 2.0 flow: start, callback, token refresh, connection status
	•	Settings → Integrations page: Apple-grade design with connect/sync functionality
	•	API endpoints: health, locations, reviews sync, connection status
	•	Security: AES-256-GCM encryption for tokens, CSRF protection, RLS-ready schema
	•	Review sync service: incremental sync with cursor tracking
	•	Routing: Fixed structure with /app/* routes, removed /general, dashboard as default
	•	Environment: Single root .env file with dotenv loading in next.config.ts

Phase 2 (Inbox & Drafting) — ✅ COMPLETED
	•	Inbox page with filters (Location, Rating, Status)
	•	AI draft generation with Gemini 2.0 Flash Exp
	•	Brand voice settings with tabbed layout
	•	Approve & post service with idempotency
	•	Dashboard with 4 KPI cards
	•	Settings/General page with organization & location info
	•	Inbox added to sidebar navigation
	•	OAuth configuration: Verified working with correct Client ID from root .env

⸻

16) Timeline:
	•	D1–2: Schema, OAuth start/callback, token storage (encrypted)
	•	D3–4: Accounts/locations import; Settings → Integrations
	•	D5–6: Review sync (manual trigger); Inbox list
	•	D7–8: Draft service + Regenerate; guardrails; Brand Voice textarea
	•	D9–10: Approve & Post (server) + audit + quotas; minimal Dashboard
	•	D11–12: Chrome extension (Generate + paste) + pairing
	•	D13–14: Tests, logs, health; enable RLS; ship

⸻

17) Launch Criteria (Go/No-Go)
	•	Live reply posted to a real, verified GBP location via server; visible publicly
	•	Audit + quota update recorded; Inbox state correct
	•	Extension reliably drafts in place on GBP page
	•	RLS enabled; tenant isolation tests pass
	•	E2E “connect→sync→draft→post” green in CI

⸻

18) Scaffolding & Bootstrapping: Monorepo layout (pnpm + Turborepo)

/apps
  /web            # Next.js App Router (UI + API)
/extension        # Chrome MV3 (Vite/Plasmo or vanilla)
/packages
  /shared         # zod types, constants, utils
  /api-contract   # (optional) shared endpoint types
  /sdk            # thin typed client for web+extension
/infra
  /supabase       # SQL migrations + RLS scripts
  /ci             # GitHub Actions

⸻

19) Rollback
	•	If posting degrades: feature-flag Approve & Post off → keep draft-only
	•	Revert last deploy; DB safe due to idempotent design

⸻

Final Note

This is a tight, de-risked MVP: one job, two surfaces, no bloat. If a request doesn’t help users draft → approve → post on GBP, it goes to the parking lot.