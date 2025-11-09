import type {
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
  UpdateBrandVoiceRequest,
  UpdateBrandVoiceResponse,
  ErrorResponse,
} from '@replygenie/api-contract';

/**
 * ReplyGenie API Client
 * Thin typed wrapper for API calls
 * Used by both web app and Chrome extension
 */

export interface ClientConfig {
  baseUrl: string;
  token?: string;
  onError?: (error: ErrorResponse) => void;
}

export class ReplyGenieClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    // Merge with any provided headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ErrorResponse;
      this.config.onError?.(error);
      throw new Error(error.message || 'API request failed');
    }

    return data as T;
  }

  // Health Check
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/v1/health');
  }

  // Locations
  async listLocations(): Promise<ListLocationsResponse> {
    return this.request<ListLocationsResponse>('/api/v1/locations');
  }

  async syncLocations(
    data: SyncLocationsRequest
  ): Promise<SyncLocationsResponse> {
    return this.request<SyncLocationsResponse>('/api/v1/locations/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reviews
  async listReviews(query: ListReviewsQuery): Promise<ListReviewsResponse> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
    return this.request<ListReviewsResponse>(
      `/api/v1/reviews?${params.toString()}`
    );
  }

  async syncReviews(data: SyncReviewsRequest): Promise<SyncReviewsResponse> {
    return this.request<SyncReviewsResponse>('/api/v1/reviews/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Drafts
  async generateDraft(
    data: GenerateDraftRequest
  ): Promise<GenerateDraftResponse> {
    return this.request<GenerateDraftResponse>('/api/v1/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Replies
  async postReply(data: PostReplyRequest): Promise<PostReplyResponse> {
    return this.request<PostReplyResponse>('/api/v1/replies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Usage
  async getUsage(): Promise<GetUsageResponse> {
    return this.request<GetUsageResponse>('/api/v1/usage');
  }

  // Brand Voice
  async updateBrandVoice(
    data: UpdateBrandVoiceRequest
  ): Promise<UpdateBrandVoiceResponse> {
    return this.request<UpdateBrandVoiceResponse>(
      '/api/v1/settings/brand-voice',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }
}
