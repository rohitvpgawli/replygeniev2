import { RcConnection } from '@/lib/db/schema';
import { refreshAccessToken } from '@/lib/google/oauth';

type PostReplyOptions = {
  reviewName: string; // Google review ID
  locationId: string; // Google location ID
  replyText: string;
  connection: RcConnection;
};

type GoogleReplyResponse = {
  replyId: string;
  updateTime: Date;
};

/**
 * Posts a reply to a Google Business Profile review
 * Handles token refresh and retries with exponential backoff
 */
export async function postReplyToGoogle(
  options: PostReplyOptions
): Promise<GoogleReplyResponse> {
  const { reviewName, locationId, replyText, connection } = options;

  // Ensure we have a valid access token
  let accessToken = connection.accessToken;
  const tokenExpiry = connection.tokenExpiresAt;

  // Refresh token if expired or about to expire (within 5 minutes)
  if (!tokenExpiry || new Date(tokenExpiry).getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(connection.refreshToken!);
    accessToken = refreshed.accessToken;
  }

  // Construct the review name in the format Google expects
  // Format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  const reviewPath = reviewName.startsWith('accounts/')
    ? reviewName
    : `accounts/-/locations/${locationId}/reviews/${reviewName}`;

  // Post reply with retry logic
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${reviewPath}/reply`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: replyText,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          replyId: data.name || reviewName,
          updateTime: data.updateTime ? new Date(data.updateTime) : new Date(),
        };
      }

      // Handle specific error codes
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 403) {
        throw new Error(`403: Location not verified or insufficient permissions - ${errorMessage}`);
      }

      if (response.status === 404) {
        throw new Error(`404: Review not found - ${errorMessage}`);
      }

      if (response.status === 429) {
        // Rate limit - wait and retry
        const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        lastError = new Error(`429: Rate limit exceeded - ${errorMessage}`);
        continue;
      }

      if (response.status >= 500) {
        // Server error - retry
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        lastError = new Error(`${response.status}: Server error - ${errorMessage}`);
        continue;
      }

      // Other errors - don't retry
      throw new Error(`Failed to post reply: ${response.status} - ${errorMessage}`);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('429') && !error.message.includes('5')) {
        // Non-retryable error
        throw error;
      }
      lastError = error as Error;
    }
  }

  // All retries exhausted
  throw lastError || new Error('Failed to post reply after multiple attempts');
}

/**
 * Deletes a reply from Google Business Profile (optional for MVP)
 */
export async function deleteReplyFromGoogle(
  reviewName: string,
  connection: RcConnection
): Promise<void> {
  let accessToken = connection.accessToken;
  const tokenExpiry = connection.tokenExpiresAt;

  // Refresh token if expired
  if (!tokenExpiry || new Date(tokenExpiry).getTime() - Date.now() < 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(connection.refreshToken!);
    accessToken = refreshed.accessToken;
  }

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || response.statusText;
    throw new Error(`Failed to delete reply: ${response.status} - ${errorMessage}`);
  }
}
