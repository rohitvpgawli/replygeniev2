# ReplyGenie MVP

**Draft → Approve → Post** Google Business Profile review replies with Apple-grade UX and Netflix-grade engineering.

## 🎯 North Star

Ship a reliable, elegant MVP that solves ONE job: draft + approve + post GBP review replies.

## 🏗️ Architecture

This is a **Turborepo monorepo** with pnpm workspaces:

```
/apps
  /web            # Next.js App Router (UI + API)
/packages
  /shared         # Shared utilities, constants, design system components
  /api-contract   # Zod schemas for type-safe API contracts
  /sdk            # Typed API client for web + extension
/infra
  /supabase       # SQL migrations + RLS scripts (coming in Phase 1)
  /ci             # GitHub Actions (coming in Phase 3)
```

## ✨ Features (MVP Scope)

- ✅ **Phase 0**: Monorepo setup with Apple-inspired design system
- 🚧 **Phase 1**: Google OAuth, location sync, settings UI
- 🚧 **Phase 2**: Review inbox, AI draft generation, approve & post
- 🚧 **Phase 3**: Chrome extension, audit logs, testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database
- Google Cloud Project (for GBP API)
- OpenAI or Anthropic API key (for draft generation)

### Installation

1. **Install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. **Start the database:**

```bash
cd apps/web
docker-compose up -d
```

4. **Run migrations:**

```bash
pnpm db:generate
pnpm db:migrate
```

5. **Start development:**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 📦 Workspace Packages

### `@replygenie/web`
Next.js 15 app with App Router. Contains all UI pages, API routes, and server-side logic.

### `@replygenie/shared`
Shared utilities, constants, and **Apple-inspired design system components**:
- `Button` - Touch-friendly (44px), rounded-xl, active:scale-[0.98]
- `Card` - Rounded-2xl with hover shadow transitions
- `Input` / `Textarea` - Rounded-xl with focus ring
- `Badge` - Status indicators with rounded-full

### `@replygenie/api-contract`
Zod schemas for all API requests/responses. Ensures type safety between web app and Chrome extension.

### `@replygenie/sdk`
Thin typed API client built on `fetch`. Used by both web app and extension for consistent API calls.

## 🎨 Design System

Following **Apple's design principles**:
- **Colors**: Apple Blue (HSL 211 100% 50%), pure white, deep charcoal
- **Border Radius**: 12px (buttons/inputs), 16px (cards)
- **Shadows**: Subtle shadow-sm, hover:shadow-md
- **Typography**: Apple system font stack (-apple-system, SF Pro Display)
- **Animations**: Smooth 200ms transitions, active:scale-[0.98] on buttons

## 🛠️ Development Commands

```bash
# Run all apps in dev mode
pnpm dev

# Build all packages
pnpm build

# Type check all packages
pnpm type-check

# Database commands (from root)
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Drizzle Studio
```

## 📋 Implementation Plan

See [`docs/plan.md`](./docs/plan.md) for the complete 3-phase implementation plan.

**Current Status**: ✅ Phase 0 Complete (Monorepo + Design System)

## 🔒 Security Principles

- **Fail closed on auth** - No Google tokens in extension, only short-lived JWT
- **Encrypt refresh tokens at rest** - Using AES-256-GCM
- **Least-privilege scopes** - Only request necessary GBP permissions
- **RLS enabled** - Row-level security for multi-tenant isolation

## 🧪 Quality Gates

- Unit tests for draft guardrails (≤90 words, no links/PII)
- Integration tests for OAuth, sync, post
- E2E test: Connect → Sync → Draft → Approve → Post
- Manual QA for non-English reviews and edge cases

## 📈 Success Metrics

- **Time-to-Reply median**: < 24h
- **Draft acceptance rate**: ≥ 70% for 4-5★ reviews
- **Coverage (30d)**: ≥ 80% of reviews replied

## 🚢 Deployment

**Recommended Stack:**
- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase (Postgres + RLS built-in)
- **AI**: OpenAI GPT-4o-mini or Anthropic Claude 3.5 Sonnet

## 📄 License

MIT

---

**Built with Apple-grade UX and Netflix-grade engineering principles.**
