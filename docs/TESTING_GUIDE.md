# Testing Guide for ReplyGenie

**Status**: Framework Ready  
**Test Coverage Goal**: 80%+

---

## Test Framework Setup

### Recommended: Vitest

```bash
# Install Vitest
cd apps/web
pnpm add -D vitest @vitest/ui

# Add to package.json scripts
"test": "vitest",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage"
```

### Alternative: Jest

```bash
# Install Jest
pnpm add -D jest @types/jest ts-jest
pnpm add -D @testing-library/react @testing-library/jest-dom

# Create jest.config.js
```

---

## Test Structure

```
apps/web/
├── lib/
│   ├── services/
│   │   ├── __tests__/
│   │   │   ├── draft-generation.test.ts
│   │   │   ├── review-sync.test.ts
│   │   │   └── google-reply.test.ts
│   ├── db/
│   │   ├── __tests__/
│   │   │   ├── rls.test.ts
│   │   │   └── queries.test.ts
│   └── auth/
│       └── __tests__/
│           ├── session.test.ts
│           └── extension-jwt.test.ts
└── app/
    └── api/
        └── __tests__/
            ├── drafts.test.ts
            └── replies.test.ts
```

---

## Unit Tests

### Draft Generation Guardrails

**File**: `lib/services/__tests__/draft-generation.test.ts`

**Test Cases**:
1. ✅ Word count ≤90 words
2. ✅ Character count ≤600 chars
3. ✅ References specific detail from review
4. ✅ Appropriate tone based on star rating
5. ✅ URL detection and stripping
6. ✅ Profanity detection and masking
7. ✅ Risk flag generation
8. ✅ Sign-off format with location name
9. ✅ Brand voice integration
10. ✅ Language matching

**Example Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { generateDraft } from '@/lib/services/draft-generation';

describe('Draft Generation', () => {
  it('should generate drafts within word limit', async () => {
    const result = await generateDraft({
      review: mockReview,
      location: mockLocation,
    });
    
    expect(result.wordCount).toBeLessThanOrEqual(90);
    expect(result.charCount).toBeLessThanOrEqual(600);
  });

  it('should flag URLs in draft', async () => {
    const result = await generateDraft({
      review: reviewWithUrl,
      location: mockLocation,
    });
    
    expect(result.riskFlags.hasUrl).toBe(true);
  });
});
```

---

### RLS (Row-Level Security)

**File**: `lib/db/__tests__/rls.test.ts`

**Test Cases**:
1. ✅ Team 1 can only see team 1 data
2. ✅ Team 2 can only see team 2 data
3. ✅ No data overlap between teams
4. ✅ No data visible without team context
5. ✅ Cannot insert data for other teams
6. ✅ Cannot update other teams' data
7. ✅ Cannot delete other teams' data

**Run RLS Tests**:
```typescript
import { runAllRLSTests } from '@/lib/db/rls-tests';

const results = await runAllRLSTests();
console.log(`Passed: ${results.passed}/${results.results.length}`);
```

---

### Extension JWT

**File**: `lib/auth/__tests__/extension-jwt.test.ts`

**Test Cases**:
1. ✅ Token signing with correct payload
2. ✅ Token verification with valid token
3. ✅ Token expiry after 15 minutes
4. ✅ Invalid token rejection
5. ✅ Expired token rejection
6. ✅ Bearer token extraction

**Example Test**:
```typescript
describe('Extension JWT', () => {
  it('should sign and verify tokens', async () => {
    const token = await signExtensionToken(1, 1);
    const payload = await verifyExtensionToken(token);
    
    expect(payload.userId).toBe(1);
    expect(payload.teamId).toBe(1);
    expect(payload.type).toBe('extension');
  });

  it('should reject expired tokens', async () => {
    // Create token with past expiry
    const expiredToken = '...';
    
    await expect(verifyExtensionToken(expiredToken))
      .rejects.toThrow('Invalid or expired token');
  });
});
```

---

## Integration Tests

### OAuth Flow

**Test Cases**:
1. ✅ Start OAuth redirects to Google
2. ✅ Callback exchanges code for tokens
3. ✅ Tokens are encrypted and stored
4. ✅ Token refresh before expiry
5. ✅ Invalid code rejection

**Example Test**:
```typescript
describe('OAuth Flow', () => {
  it('should complete full OAuth flow', async () => {
    // Mock Google OAuth response
    mockGoogleOAuth({
      access_token: 'test_access',
      refresh_token: 'test_refresh',
      expires_in: 3600,
    });

    // Start OAuth
    const { url } = await startOAuth(userId, teamId);
    expect(url).toContain('accounts.google.com');

    // Handle callback
    const result = await handleOAuthCallback(code, state);
    expect(result.success).toBe(true);

    // Verify tokens stored
    const connection = await getConnection(teamId);
    expect(connection).toBeDefined();
    expect(connection.accessToken).toBeDefined();
  });
});
```

---

### Review Sync

**Test Cases**:
1. ✅ Fetch reviews from GBP API
2. ✅ Insert new reviews
3. ✅ Skip existing reviews (by google_review_id)
4. ✅ Update sync cursor
5. ✅ Handle pagination
6. ✅ Retry on 429/5xx errors

---

### Reply Posting

**Test Cases**:
1. ✅ Post reply to GBP
2. ✅ Idempotent posting (unique constraint)
3. ✅ Update review status
4. ✅ Increment usage count
5. ✅ Create audit log
6. ✅ Handle 403 (unverified location)
7. ✅ Handle 429 (rate limit)
8. ✅ Token refresh on 401

---

## E2E Tests (Optional)

### Playwright Setup

```bash
pnpm add -D @playwright/test
npx playwright install
```

### E2E Test Scenarios

**Scenario 1: Complete Review Reply Flow**
```typescript
test('complete review reply flow', async ({ page }) => {
  // 1. Login
  await page.goto('/sign-in');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 2. Navigate to Inbox
  await page.click('text=Inbox');
  await expect(page).toHaveURL('/app/inbox');

  // 3. Generate draft
  await page.click('button:has-text("Generate Draft")');
  await page.waitForSelector('text=Draft generated');

  // 4. Approve & post
  await page.click('button:has-text("Approve & Post")');
  await page.waitForSelector('text=Posted');

  // 5. Verify in audit log
  await page.click('text=Audit Log');
  await expect(page.locator('text=REPLY_POSTED')).toBeVisible();
});
```

**Scenario 2: Extension Flow**
```typescript
test('extension generates draft', async ({ page, context }) => {
  // Load extension
  const extensionPath = path.join(__dirname, '../extension');
  await context.addInitScript({ path: extensionPath });

  // Navigate to GBP
  await page.goto('https://business.google.com/reviews');

  // Click Generate Draft button
  await page.click('#replygenie-generate-btn');

  // Verify draft inserted
  const textarea = await page.locator('textarea[aria-label*="reply"]');
  const value = await textarea.inputValue();
  expect(value.length).toBeGreaterThan(0);
});
```

---

## Manual Testing Checklist

### Phase 1: Authentication
- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Sign out
- [ ] Session persists across page reloads
- [ ] Session expires after 24 hours

### Phase 2: Google OAuth
- [ ] Connect Google Business Profile
- [ ] OAuth redirects to Google
- [ ] Callback handles success
- [ ] Tokens stored encrypted
- [ ] Token refresh works
- [ ] Disconnect removes tokens

### Phase 3: Location Sync
- [ ] Sync locations from GBP
- [ ] Verified locations shown
- [ ] Unverified locations flagged
- [ ] Location details displayed
- [ ] Last sync time updated

### Phase 4: Review Sync
- [ ] Sync reviews for location
- [ ] New reviews inserted
- [ ] Existing reviews skipped
- [ ] Pagination handled
- [ ] Sync cursor updated
- [ ] Reviews shown in inbox

### Phase 5: Draft Generation
- [ ] Generate draft for 5-star review
- [ ] Generate draft for 1-star review
- [ ] Draft within word limit
- [ ] Draft references review details
- [ ] Brand voice applied
- [ ] Regenerate draft works
- [ ] Edit draft works

### Phase 6: Reply Posting
- [ ] Approve & post draft
- [ ] Reply appears on Google
- [ ] Review marked as posted
- [ ] Usage count incremented
- [ ] Audit log created
- [ ] Quota enforced
- [ ] Cannot post twice (idempotent)

### Phase 7: Chrome Extension
- [ ] Extension installs
- [ ] Extension connects to app
- [ ] Button appears on GBP page
- [ ] Generate draft works
- [ ] Draft inserted into textarea
- [ ] Fallback link works

### Phase 8: Audit Log
- [ ] All actions logged
- [ ] Filters work
- [ ] Pagination works
- [ ] User attribution correct
- [ ] Timestamps accurate

---

## Performance Testing

### Load Testing with k6

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const res = http.get('http://localhost:3000/api/v1/reviews');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Performance Benchmarks

- **API Response Time**: < 300ms (p95)
- **Draft Generation**: < 5s
- **Review Sync**: < 10s for 100 reviews
- **Database Queries**: < 100ms (p95)

---

## Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Services | 90%+ |
| API Routes | 80%+ |
| Database | 85%+ |
| Auth | 95%+ |
| Overall | 80%+ |

---

## Running Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# RLS tests
pnpm tsx lib/db/rls-tests.ts
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Next Steps

1. **Install Test Framework**: Choose Vitest or Jest
2. **Write Unit Tests**: Start with critical services
3. **Add Integration Tests**: OAuth, sync, posting
4. **Set Up E2E**: Playwright for full flows
5. **Configure CI**: Run tests on every PR
6. **Monitor Coverage**: Aim for 80%+

---

**Last Updated**: November 9, 2024  
**Test Files Created**: 1 (RLS tests)  
**Test Files Needed**: ~15-20 for full coverage
