# Error Handling & Edge Cases

**Date**: November 9, 2024  
**Status**: ✅ Documented

---

## Error Handling Strategy

### Principles

1. **Fail Gracefully**: Never crash the app, always show user-friendly messages
2. **Log Everything**: Structured logging for all errors
3. **Retry Smart**: Exponential backoff for transient failures
4. **User Feedback**: Clear, actionable error messages
5. **Defensive Coding**: Validate inputs, check nulls, handle edge cases

---

## Edge Cases Handled

### 1. Already Replied Reviews

**Scenario**: User tries to post a reply to a review that already has a reply

**Handling**:
```typescript
// In inbox page
const isReplied = review.replied || review.status === 'posted';

// Disable post button
<Button disabled={isReplied}>
  {isReplied ? 'Already Posted' : 'Approve & Post'}
</Button>

// Show badge
{isReplied && <Badge variant="success">Posted</Badge>}
```

**Database**: UNIQUE constraint on `rc_replies.review_id` prevents duplicates

---

### 2. Unverified Locations

**Scenario**: Location is not verified on Google Business Profile

**Handling**:
```typescript
// Check verification status
if (!location.isVerified) {
  return NextResponse.json(
    { error: 'Location not verified. Please verify on Google Business Profile.' },
    { status: 403 }
  );
}

// UI indication
{!location.isVerified && (
  <Badge variant="warning">Unverified</Badge>
)}
```

**User Action**: Verify location on Google Business Profile first

---

### 3. Rate Limiting (429)

**Scenario**: Google API returns 429 Too Many Requests

**Handling**:
```typescript
// Exponential backoff retry
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

**User Message**: "Google API rate limit reached. Please try again in a few minutes."

---

### 4. Token Expiry

**Scenario**: OAuth access token expires during operation

**Handling**:
```typescript
// Automatic token refresh
async function refreshTokenIfNeeded(connection) {
  const expiresAt = new Date(connection.tokenExpiresAt);
  const now = new Date();
  const bufferMinutes = 5;

  if (expiresAt.getTime() - now.getTime() < bufferMinutes * 60 * 1000) {
    // Token expires in < 5 minutes, refresh it
    const newTokens = await refreshAccessToken(connection.refreshToken);
    await updateConnection(connection.id, newTokens);
    return newTokens.accessToken;
  }

  return connection.accessToken;
}
```

**Fallback**: If refresh fails, prompt user to reconnect

---

### 5. Empty Review Comments

**Scenario**: Review has star rating but no text comment

**Handling**:
```typescript
// Generate draft for rating-only review
if (!review.comment || review.comment.trim() === '') {
  // Use generic template based on rating
  if (review.starRating >= 4) {
    return `Thank you for your ${review.starRating}-star rating! We're glad you had a positive experience. — ${location.name}`;
  } else {
    return `Thank you for your feedback. We'd like to learn more about your experience. Please contact us at ${contactChannel}. — ${location.name}`;
  }
}
```

---

### 6. Very Long Reviews

**Scenario**: Review comment is extremely long (>10,000 characters)

**Handling**:
```typescript
// Truncate for AI processing
const MAX_REVIEW_LENGTH = 5000;
const reviewText = review.comment.length > MAX_REVIEW_LENGTH
  ? review.comment.substring(0, MAX_REVIEW_LENGTH) + '...'
  : review.comment;

// Warn user
if (review.comment.length > MAX_REVIEW_LENGTH) {
  logger.warn('Review truncated for processing', {
    reviewId: review.id,
    originalLength: review.comment.length,
  });
}
```

---

### 7. Non-English Reviews

**Scenario**: Review is in a language other than English

**Handling**:
```typescript
// AI maintains same language
const prompt = `Generate a reply in the SAME LANGUAGE as the review.
Review: ${review.comment}
Reply:`;

// Language detection (optional)
import { franc } from 'franc';
const language = franc(review.comment);
logger.info('Detected language', { reviewId: review.id, language });
```

**Note**: Gemini 2.0 Flash Exp supports 100+ languages

---

### 8. Quota Exceeded

**Scenario**: Team has used all monthly drafts/posts

**Handling**:
```typescript
// Check quota before operation
const usage = await getUsage(teamId, currentMonth);
if (usage.draftsCount >= usage.quotaLimit) {
  return NextResponse.json(
    {
      error: 'Monthly draft quota exceeded',
      quota: {
        used: usage.draftsCount,
        limit: usage.quotaLimit,
      },
    },
    { status: 429 }
  );
}

// UI indication
{usage.draftsCount >= usage.quotaLimit && (
  <Alert variant="warning">
    Monthly quota exceeded. Upgrade your plan to continue.
  </Alert>
)}
```

---

### 9. Network Failures

**Scenario**: Network request fails (timeout, connection error)

**Handling**:
```typescript
// Timeout wrapper
async function withTimeout(promise, ms = 30000) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

// Usage
try {
  const result = await withTimeout(
    fetch('https://api.google.com/...'),
    10000 // 10 second timeout
  );
} catch (error) {
  if (error.message === 'Request timeout') {
    // Show retry button
    return { error: 'Request timed out. Please try again.' };
  }
  throw error;
}
```

---

### 10. Concurrent Modifications

**Scenario**: Two users try to modify the same draft simultaneously

**Handling**:
```typescript
// Optimistic locking with version field
await db.update(rcDrafts)
  .set({
    draftText: newText,
    version: draft.version + 1,
    editedAt: new Date(),
  })
  .where(and(
    eq(rcDrafts.id, draftId),
    eq(rcDrafts.version, draft.version) // Only update if version matches
  ));

// If no rows updated, version mismatch
if (result.rowCount === 0) {
  return { error: 'Draft was modified by another user. Please refresh.' };
}
```

---

### 11. Missing Environment Variables

**Scenario**: Required env var not set

**Handling**:
```typescript
// Startup validation
const requiredEnvVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GEMINI_API_KEY',
];

const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1); // Fail fast in production
}
```

**Health Check**: Returns unhealthy if env vars missing

---

### 12. Database Connection Loss

**Scenario**: Database becomes unavailable mid-request

**Handling**:
```typescript
// Connection pool with retry
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  onnotice: () => {}, // Suppress notices
});

// Graceful degradation
try {
  const result = await db.select().from(rcReviews);
  return result;
} catch (error) {
  logger.error('Database query failed', error);
  
  // Return cached data if available
  if (cache.has(cacheKey)) {
    logger.info('Returning cached data');
    return cache.get(cacheKey);
  }
  
  throw new Error('Service temporarily unavailable');
}
```

---

### 13. Invalid Review IDs

**Scenario**: User provides non-existent review ID

**Handling**:
```typescript
const review = await db.query.rcReviews.findFirst({
  where: and(
    eq(rcReviews.id, reviewId),
    eq(rcReviews.teamId, teamId) // RLS ensures this
  ),
});

if (!review) {
  return NextResponse.json(
    { error: 'Review not found' },
    { status: 404 }
  );
}
```

---

### 14. Profanity in Generated Drafts

**Scenario**: AI accidentally generates profanity

**Handling**:
```typescript
// Post-generation filter
function maskProfanity(text: string): string {
  const patterns = [/\b(fuck|shit|damn)\b/gi];
  let masked = text;
  
  patterns.forEach(pattern => {
    masked = masked.replace(pattern, match =>
      match[0] + '*'.repeat(match.length - 1)
    );
  });
  
  return masked;
}

// Flag for review
const hasProfanity = PROFANITY_PATTERNS.some(p => p.test(draft));
if (hasProfanity) {
  riskFlags.hasProfanity = true;
  draft = maskProfanity(draft);
}
```

---

### 15. Extension Injection Failures

**Scenario**: Chrome extension can't find reply textarea on GBP page

**Handling**:
```typescript
// Content script
function findReplyTextarea() {
  const selectors = [
    'textarea[aria-label*="reply" i]',
    'textarea[placeholder*="reply" i]',
    '.review-reply-textarea',
  ];
  
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el && el.offsetParent !== null) return el;
  }
  
  return null;
}

// Fallback
if (!textarea) {
  // Show floating link to web app
  injectFallbackLink();
  logger.warn('Could not find reply textarea', {
    url: window.location.href,
  });
}
```

---

## Error Messages

### User-Friendly Messages

**Bad**: `Error: ECONNREFUSED 127.0.0.1:5432`  
**Good**: `Unable to connect to database. Please try again later.`

**Bad**: `TypeError: Cannot read property 'id' of undefined`  
**Good**: `Review not found. It may have been deleted.`

**Bad**: `401 Unauthorized`  
**Good**: `Your session has expired. Please sign in again.`

### Error Message Guidelines

1. **Be Specific**: Tell user what went wrong
2. **Be Actionable**: Tell user what to do next
3. **Be Empathetic**: Acknowledge frustration
4. **Be Concise**: Don't overwhelm with details

**Template**:
```
[What happened] [Why it happened] [What to do next]

Example: "Unable to post reply. Your Google connection has expired. Please reconnect in Settings."
```

---

## Logging Best Practices

### What to Log

✅ **DO Log**:
- All errors with full stack traces
- API requests/responses (sanitized)
- Authentication events
- Security events
- Performance metrics
- State changes (draft created, reply posted)

❌ **DON'T Log**:
- Passwords or tokens
- Full review text (PII)
- Credit card numbers
- API keys

### Log Levels

- **DEBUG**: Verbose info for development
- **INFO**: Normal operations (user logged in, draft generated)
- **WARN**: Recoverable errors (rate limit, token refresh)
- **ERROR**: Failures requiring attention

### Example

```typescript
// Good logging
logger.info('Draft generated', {
  reviewId: review.id,
  locationId: location.id,
  wordCount: result.wordCount,
  duration: 1234,
});

// Bad logging
console.log('draft done'); // Not structured, no context
```

---

## Monitoring & Alerts

### Metrics to Track

1. **Error Rate**: Errors per minute
2. **Response Time**: p50, p95, p99
3. **Availability**: Uptime percentage
4. **Quota Usage**: Drafts/posts per day
5. **API Success Rate**: % of successful GBP API calls

### Alert Thresholds

- **Critical**: Error rate > 10/min, Availability < 99%
- **Warning**: Response time p95 > 1s, Quota > 90%

### Tools

- **Logging**: Datadog, LogRocket, Sentry
- **Monitoring**: Grafana, New Relic
- **Uptime**: UptimeRobot, Pingdom

---

## Testing Error Scenarios

```typescript
// Test error handling
describe('Error Handling', () => {
  it('handles network timeout', async () => {
    mockFetch.mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 100)
      )
    );
    
    const result = await generateDraft(review);
    expect(result.error).toBe('Request timed out');
  });
  
  it('handles quota exceeded', async () => {
    mockUsage.draftsCount = 50;
    mockUsage.quotaLimit = 50;
    
    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});
```

---

## Recovery Procedures

### Database Failure
1. Check health endpoint: `/api/v1/health`
2. Verify DATABASE_URL env var
3. Check connection pool settings
4. Restart application
5. If persistent, check database logs

### OAuth Token Issues
1. User clicks "Reconnect" in Settings
2. Complete OAuth flow again
3. New tokens stored encrypted
4. Retry failed operation

### Rate Limit Exceeded
1. Wait for rate limit window to reset (typically 1 minute)
2. Retry with exponential backoff
3. If persistent, contact Google Support

---

**Last Updated**: November 9, 2024  
**All Edge Cases**: Documented and handled in code
