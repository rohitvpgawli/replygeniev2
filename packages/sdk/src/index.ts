// Export the API client
export * from './client';

// Re-export types from api-contract for convenience
export type {
  Location,
  Review,
  Draft,
  Reply,
  Usage,
  AuditLog,
  HealthResponse,
  ListLocationsResponse,
  SyncLocationsRequest,
  SyncLocationsResponse,
  ListReviewsQuery,
  ListReviewsResponse,
  SyncReviewsRequest,
  SyncReviewsResponse,
  GenerateDraftRequest,
  GenerateDraftResponse,
  PostReplyRequest,
  PostReplyResponse,
  GetUsageResponse,
  BrandVoiceSettings,
  UpdateBrandVoiceRequest,
  UpdateBrandVoiceResponse,
  ErrorResponse,
} from '@replygenie/api-contract';
