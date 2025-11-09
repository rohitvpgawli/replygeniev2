/**
 * ReplyGenie MVP Constants
 * Following Apple-grade UX and Netflix-grade engineering principles
 */

// Draft Generation Guardrails
export const DRAFT_CONSTRAINTS = {
  MAX_WORDS: 90,
  MAX_CHARS: 600,
  MIN_DETAIL_WORDS: 3, // Must reference at least 3 words from review
} as const;

// Review Rating Thresholds
export const RATING_THRESHOLDS = {
  POSITIVE: 4, // 4-5 stars
  NEGATIVE: 3, // ≤3 stars
} as const;

// Quota Limits
export const QUOTA_LIMITS = {
  DEFAULT_MONTHLY_POSTS: 100,
  FREE_TIER_POSTS: 50,
} as const;

// API Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY_MS: 1000,
  MAX_DELAY_MS: 10000,
  BACKOFF_MULTIPLIER: 2,
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  EXTENSION_TOKEN_EXPIRY_MINUTES: 15,
  WEB_SESSION_EXPIRY_DAYS: 30,
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  MAX_REVIEWS_PER_SYNC: 100,
  SYNC_LOOKBACK_DAYS: 90,
} as const;

// UI Animation Durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

// Apple Design System Values
export const DESIGN_TOKENS = {
  BORDER_RADIUS: {
    SM: '0.5rem',    // 8px
    MD: '0.75rem',   // 12px - buttons/inputs
    LG: '1rem',      // 16px - cards
    XL: '1.25rem',   // 20px
  },
  SPACING: {
    MOBILE_PADDING: '1.5rem',  // 24px
    DESKTOP_PADDING: '3rem',   // 48px
  },
  BUTTON_HEIGHT: '2.75rem',    // 44px - touch-friendly
} as const;
