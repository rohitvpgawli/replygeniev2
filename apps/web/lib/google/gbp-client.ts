/**
 * Google Business Profile API Client
 * Handles interactions with Google My Business API
 */

const GBP_API_BASE = 'https://mybusiness.googleapis.com/v4';
const GBP_API_V1_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';

interface GbpLocation {
  name: string; // Format: accounts/{accountId}/locations/{locationId}
  locationName: string;
  primaryPhone?: string;
  websiteUri?: string;
  locationState?: {
    isVerified?: boolean;
  };
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    regionCode?: string;
  };
}

interface GbpReview {
  name: string; // Format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

interface GbpAccount {
  name: string; // Format: accounts/{accountId}
  accountName: string;
  type: string;
}

/**
 * Retry helper with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited, wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter 
          ? parseInt(retryAfter) * 1000 
          : Math.min(1000 * Math.pow(2, attempt), 10000); // Max 10s
        
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (attempt < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Fetches all accounts accessible by the access token
 */
export async function fetchAccounts(accessToken: string): Promise<GbpAccount[]> {
  const response = await fetchWithRetry(`${GBP_API_V1_BASE}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch accounts:', error);
    throw new Error(`Failed to fetch accounts: ${response.status}`);
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Fetches all locations for an account
 */
export async function fetchLocations(
  accessToken: string,
  accountId: string
): Promise<GbpLocation[]> {
  const response = await fetchWithRetry(
    `${GBP_API_V1_BASE}/accounts/${accountId}/locations?readMask=name,title,phoneNumbers,websiteUri,storefrontAddress,metadata`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch locations:', error);
    throw new Error(`Failed to fetch locations: ${response.status}`);
  }

  const data = await response.json();
  return data.locations || [];
}

/**
 * Fetches reviews for a location with pagination support
 */
export async function fetchReviews(
  accessToken: string,
  locationName: string, // Format: accounts/{accountId}/locations/{locationId}
  pageSize: number = 50,
  pageToken?: string
): Promise<{ reviews: GbpReview[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const response = await fetchWithRetry(
    `${GBP_API_BASE}/${locationName}/reviews?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to fetch reviews:', error);
    throw new Error(`Failed to fetch reviews: ${response.status}`);
  }

  const data = await response.json();
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Posts a reply to a review
 */
export async function postReviewReply(
  accessToken: string,
  reviewName: string, // Format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
  replyText: string
): Promise<void> {
  const response = await fetch(`${GBP_API_BASE}/${reviewName}/reply`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      comment: replyText,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to post reply:', error);
    throw new Error(`Failed to post reply: ${response.status}`);
  }
}

/**
 * Converts star rating enum to number
 */
export function starRatingToNumber(rating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 0;
}

/**
 * Formats address from GBP format to string
 */
export function formatAddress(address?: GbpLocation['storefrontAddress']): string {
  if (!address) return '';

  const parts = [
    ...(address.addressLines || []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ].filter(Boolean);

  return parts.join(', ');
}
