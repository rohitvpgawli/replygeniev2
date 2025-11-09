import { db } from '@/lib/db/drizzle';
import { rcLocations, rcReviews, rcAuditLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { fetchReviews, starRatingToNumber } from '@/lib/google/gbp-client';
import { getValidAccessToken } from '@/lib/google/oauth';

interface SyncResult {
  success: boolean;
  newReviews: number;
  totalReviews: number;
  error?: string;
}

/**
 * Syncs reviews for a specific location
 * Implements incremental sync using sync_cursor
 */
export async function syncReviews(
  locationId: number,
  teamId: number,
  userId: number
): Promise<SyncResult> {
  try {
    // Get location details
    const [location] = await db
      .select()
      .from(rcLocations)
      .where(eq(rcLocations.id, locationId))
      .limit(1);

    if (!location) {
      return {
        success: false,
        newReviews: 0,
        totalReviews: 0,
        error: 'Location not found',
      };
    }

    // Verify location belongs to team
    if (location.teamId !== teamId) {
      return {
        success: false,
        newReviews: 0,
        totalReviews: 0,
        error: 'Unauthorized',
      };
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(teamId);
    if (!accessToken) {
      return {
        success: false,
        newReviews: 0,
        totalReviews: 0,
        error: 'No valid access token',
      };
    }

    let newReviewsCount = 0;
    let totalReviewsCount = 0;
    let pageToken: string | undefined;
    const maxPages = 10; // Limit to prevent infinite loops
    let pageCount = 0;

    // Fetch reviews with pagination
    do {
      const { reviews, nextPageToken } = await fetchReviews(
        accessToken,
        location.googleLocationId,
        50,
        pageToken
      );

      totalReviewsCount += reviews.length;

      // Process each review
      for (const review of reviews) {
        const reviewCreateTime = new Date(review.createTime);
        const reviewUpdateTime = new Date(review.updateTime);

        // Skip if review is older than sync cursor (already synced)
        if (location.syncCursor && reviewCreateTime < location.syncCursor) {
          continue;
        }

        // Check if review already exists
        const [existingReview] = await db
          .select()
          .from(rcReviews)
          .where(eq(rcReviews.googleReviewId, review.reviewId))
          .limit(1);

        if (existingReview) {
          // Update existing review if it was modified
          if (reviewUpdateTime > existingReview.reviewUpdateTime!) {
            await db
              .update(rcReviews)
              .set({
                reviewerName: review.reviewer.displayName,
                reviewerProfilePhotoUrl: review.reviewer.profilePhotoUrl,
                starRating: starRatingToNumber(review.starRating),
                comment: review.comment,
                reviewUpdateTime,
                replied: !!review.reviewReply,
                updatedAt: new Date(),
              })
              .where(eq(rcReviews.id, existingReview.id));
          }
        } else {
          // Insert new review
          await db.insert(rcReviews).values({
            teamId,
            locationId,
            googleReviewId: review.reviewId,
            reviewerName: review.reviewer.displayName,
            reviewerProfilePhotoUrl: review.reviewer.profilePhotoUrl,
            starRating: starRatingToNumber(review.starRating),
            comment: review.comment,
            reviewCreateTime,
            reviewUpdateTime,
            replied: !!review.reviewReply,
            status: 'pending',
          });

          newReviewsCount++;
        }
      }

      pageToken = nextPageToken;
      pageCount++;
    } while (pageToken && pageCount < maxPages);

    // Update location's sync cursor and last sync time
    await db
      .update(rcLocations)
      .set({
        syncCursor: new Date(),
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(rcLocations.id, locationId));

    // Create audit log
    await db.insert(rcAuditLogs).values({
      teamId,
      userId,
      action: 'REVIEWS_SYNCED',
      entityType: 'location',
      entityId: locationId,
      metadata: {
        newReviews: newReviewsCount,
        totalReviews: totalReviewsCount,
      },
    });

    return {
      success: true,
      newReviews: newReviewsCount,
      totalReviews: totalReviewsCount,
    };
  } catch (error) {
    console.error('Error syncing reviews:', error);
    return {
      success: false,
      newReviews: 0,
      totalReviews: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Syncs locations from Google Business Profile
 */
export async function syncLocations(
  teamId: number,
  userId: number,
  accountId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const accessToken = await getValidAccessToken(teamId);
    if (!accessToken) {
      return {
        success: false,
        count: 0,
        error: 'No valid access token',
      };
    }

    // Import fetchLocations and formatAddress
    const { fetchLocations, formatAddress } = await import('@/lib/google/gbp-client');
    
    const locations = await fetchLocations(accessToken, accountId);

    let syncedCount = 0;

    for (const location of locations) {
      // Check if location already exists
      const [existing] = await db
        .select()
        .from(rcLocations)
        .where(eq(rcLocations.googleLocationId, location.name))
        .limit(1);

      const locationData = {
        name: location.locationName,
        address: formatAddress(location.storefrontAddress),
        phoneNumber: location.primaryPhone,
        websiteUrl: location.websiteUri,
        isVerified: location.locationState?.isVerified || false,
        updatedAt: new Date(),
      };

      if (existing) {
        // Update existing location
        await db
          .update(rcLocations)
          .set(locationData)
          .where(eq(rcLocations.id, existing.id));
      } else {
        // Get connection ID
        const { rcConnections } = await import('@/lib/db/schema');
        const [connection] = await db
          .select()
          .from(rcConnections)
          .where(eq(rcConnections.teamId, teamId))
          .limit(1);

        if (!connection) {
          continue;
        }

        // Insert new location
        await db.insert(rcLocations).values({
          teamId,
          connectionId: connection.id,
          googleLocationId: location.name,
          ...locationData,
        });

        syncedCount++;
      }
    }

    // Create audit log
    await db.insert(rcAuditLogs).values({
      teamId,
      userId,
      action: 'LOCATIONS_SYNCED',
      entityType: 'connection',
      metadata: {
        count: syncedCount,
        accountId,
      },
    });

    return {
      success: true,
      count: syncedCount,
    };
  } catch (error) {
    console.error('Error syncing locations:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
