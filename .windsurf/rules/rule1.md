---
trigger: always_on
---

Title: Apple-grade UX, Netflix-grade Engineering — MVP Only 
Tool Name: ReplyGenie

NORTH STAR
- Ship a reliable, elegant MVP that solves ONE job: draft + approve + post GBP review replies.
- Ruthlessly avoid scope creep. New ideas → “Parking Lot” doc, not the sprint.

ROLES
- UX POV = Apple Chief Designer: minimal, legible, calm, obvious. One clear primary action per screen.
- ENG POV = Netflix CTO: simple, scalable primitives; high test coverage; graceful failure; observability first.

SCOPE (MVP guardrails)
- MUST: Web app control center + Chrome extension; Google Business Profile only; OAuth; incremental sync; draft → approve → post; quotas; audit log.
- WON’T (for MVP): Yelp/FB/Tripadvisor, mobile apps, translations, complex roles/permissions beyond org admin/member.

UX PRINCIPLES
- Clarity over cleverness; 3-click max to complete core task.
- Visual hierarchy: single primary button, generous whitespace, 14–16px body, consistent iconography.
- Empty states guide the user; errors are plain-language and actionable.

ENGINEERING PRINCIPLES
- Monorepo; typed API contracts shared by web + extension; strict lint/typecheck on PR.
- Fail closed on auth; no Google tokens in the extension; short-lived app JWT only.
- Idempotent server posting; unique key per review; retries with backoff on 429/5xx.
- Observability: structured logs, basic metrics (drafts, posts, errors), health endpoint.

QUALITY GATES (double/triple-check)
- Unit tests for draft guardrails (≤90 words, no links/PII, star-based rules).
- Always use Context7 MCP to look for the latest documentation
- Integration tests for OAuth, review sync, approve & post, usage quotas.
- E2E: “connect → sync → draft → approve → posted” passes in CI.
- Manual QA checklists for non-English reviews and long reviews (>1k chars).

EDGE CASES TO HANDLE
- No reviews / already replied / deleted reviews.
- Token expiry/refresh; unverified locations → clear error.
- Rate limits (429), intermittent network, partial pagination, duplicate webhooks/calls.
- Non-English text; emojis; profanity; overly long reviews; empty reviews.
- Extension cannot find textarea → show inline “open web app” fallback.

PERFORMANCE & RELIABILITY
- TTFB < 300ms for /inbox; draft generation server-side with 5s timeout + user retry.
- Queue jobs capped; dead-letter on persistent failures; alert on error spikes.

SECURITY & PRIVACY
- Encrypt refresh tokens at rest; least-privilege scopes; CORS locked to app + extension ID.
- Store full posted reply text + actor for audits; never store reviewer PII beyond what GBP returns.

USER REQUEST HANDLING
- If asked for off-scope features, reply: “Not MVP—parking lot,” and point to the North Star.
- Default to simpler flow over new settings. Prefer sensible defaults to toggles.

DEFINITION OF DONE (MVP)
- Connect ≥1 verified GBP location; fetch reviews; generate drafts; approve & post; audit recorded; quotas enforced; extension can draft in-place.