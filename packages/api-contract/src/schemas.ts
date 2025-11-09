import { z } from 'zod';

/**
 * ReplyGenie API Contract Schemas
 * Shared between web app and Chrome extension
 */

// ============================================================================
// Core Entity Schemas
// ============================================================================

export const LocationSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  googleLocationId: z.string(),
  name: z.string(),
  address: z.string().optional(),
  verified: z.boolean(),
  syncCursor: z.string().optional(),
  lastSyncAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  locationId: z.string().uuid(),
  googleReviewId: z.string(),
  reviewerName: z.string(),
  reviewerPhotoUrl: z.string().url().optional(),
  rating: z.number().int().min(1).max(5),
  text: z.string().optional(),
  reviewCreateTime: z.string().datetime(),
  replied: z.boolean(),
  status: z.enum(['pending', 'draft_generated', 'posted']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const DraftSchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  text: z.string().max(600),
  wordCount: z.number().int().max(90),
  riskFlags: z.record(z.boolean()).optional(),
  generatedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const ReplySchema = z.object({
  id: z.string().uuid(),
  reviewId: z.string().uuid(),
  text: z.string(),
  postedBy: z.string().uuid(),
  postedAt: z.string().datetime(),
  googleReplyId: z.string().optional(),
});

export const UsageSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
  postsCount: z.number().int().min(0),
  limit: z.number().int().min(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
  action: z.enum([
    'review_synced',
    'draft_generated',
    'draft_regenerated',
    'reply_posted',
    'connection_added',
    'connection_removed',
  ]),
  entityType: z.enum(['review', 'draft', 'reply', 'connection']),
  entityId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

// ============================================================================
// API Request/Response Schemas
// ============================================================================

// Health Check
export const HealthResponseSchema = z.object({
  ok: z.boolean(),
  minClientVersion: z.string(),
  timestamp: z.string().datetime(),
});

// OAuth
export const OAuthStartResponseSchema = z.object({
  authUrl: z.string().url(),
});

export const OAuthCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export const OAuthCallbackResponseSchema = z.object({
  success: z.boolean(),
  redirectUrl: z.string().url(),
});

// Locations
export const ListLocationsResponseSchema = z.object({
  locations: z.array(LocationSchema),
  total: z.number().int(),
});

export const SyncLocationsRequestSchema = z.object({
  forceRefresh: z.boolean().optional(),
});

export const SyncLocationsResponseSchema = z.object({
  synced: z.number().int(),
  locations: z.array(LocationSchema),
});

// Reviews
export const ListReviewsQuerySchema = z.object({
  locationId: z.string().uuid().optional(),
  status: z.enum(['pending', 'draft_generated', 'posted']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ListReviewsResponseSchema = z.object({
  reviews: z.array(ReviewSchema),
  total: z.number().int(),
  hasMore: z.boolean(),
});

export const SyncReviewsRequestSchema = z.object({
  locationId: z.string().uuid(),
});

export const SyncReviewsResponseSchema = z.object({
  synced: z.number().int(),
  newReviews: z.number().int(),
});

// Drafts
export const GenerateDraftRequestSchema = z.object({
  reviewId: z.string().uuid(),
  regenerate: z.boolean().optional(),
});

export const GenerateDraftResponseSchema = z.object({
  draft: DraftSchema,
  review: ReviewSchema,
});

// Replies
export const PostReplyRequestSchema = z.object({
  reviewId: z.string().uuid(),
  text: z.string().min(1).max(600),
});

export const PostReplyResponseSchema = z.object({
  reply: ReplySchema,
  review: ReviewSchema,
  usage: UsageSchema,
});

// Usage/Quota
export const GetUsageResponseSchema = z.object({
  usage: UsageSchema,
  remaining: z.number().int(),
  percentUsed: z.number().min(0).max(100),
});

// Brand Voice Settings
export const BrandVoiceSettingsSchema = z.object({
  guidance: z.string().max(500).optional(),
  contactChannel: z.string().max(200).optional(),
  signOff: z.string().max(100).optional(),
});

export const UpdateBrandVoiceRequestSchema = BrandVoiceSettingsSchema;

export const UpdateBrandVoiceResponseSchema = z.object({
  settings: BrandVoiceSettingsSchema,
});

// Extension Authentication
export const ExtensionAuthRequestSchema = z.object({
  pairingCode: z.string().length(6).optional(),
});

export const ExtensionAuthResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
});

export const ExtensionDraftRequestSchema = z.object({
  reviewId: z.string().uuid().optional(),
  reviewText: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const ExtensionDraftResponseSchema = z.object({
  text: z.string(),
  wordCount: z.number().int(),
});

// Error Response
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Location = z.infer<typeof LocationSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type Draft = z.infer<typeof DraftSchema>;
export type Reply = z.infer<typeof ReplySchema>;
export type Usage = z.infer<typeof UsageSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type OAuthStartResponse = z.infer<typeof OAuthStartResponseSchema>;
export type OAuthCallbackQuery = z.infer<typeof OAuthCallbackQuerySchema>;
export type OAuthCallbackResponse = z.infer<typeof OAuthCallbackResponseSchema>;

export type ListLocationsResponse = z.infer<typeof ListLocationsResponseSchema>;
export type SyncLocationsRequest = z.infer<typeof SyncLocationsRequestSchema>;
export type SyncLocationsResponse = z.infer<typeof SyncLocationsResponseSchema>;

export type ListReviewsQuery = z.infer<typeof ListReviewsQuerySchema>;
export type ListReviewsResponse = z.infer<typeof ListReviewsResponseSchema>;
export type SyncReviewsRequest = z.infer<typeof SyncReviewsRequestSchema>;
export type SyncReviewsResponse = z.infer<typeof SyncReviewsResponseSchema>;

export type GenerateDraftRequest = z.infer<typeof GenerateDraftRequestSchema>;
export type GenerateDraftResponse = z.infer<typeof GenerateDraftResponseSchema>;

export type PostReplyRequest = z.infer<typeof PostReplyRequestSchema>;
export type PostReplyResponse = z.infer<typeof PostReplyResponseSchema>;

export type GetUsageResponse = z.infer<typeof GetUsageResponseSchema>;

export type BrandVoiceSettings = z.infer<typeof BrandVoiceSettingsSchema>;
export type UpdateBrandVoiceRequest = z.infer<typeof UpdateBrandVoiceRequestSchema>;
export type UpdateBrandVoiceResponse = z.infer<typeof UpdateBrandVoiceResponseSchema>;

export type ExtensionAuthRequest = z.infer<typeof ExtensionAuthRequestSchema>;
export type ExtensionAuthResponse = z.infer<typeof ExtensionAuthResponseSchema>;
export type ExtensionDraftRequest = z.infer<typeof ExtensionDraftRequestSchema>;
export type ExtensionDraftResponse = z.infer<typeof ExtensionDraftResponseSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
