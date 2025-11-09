import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  rcReplies,
  rcReviews,
  rcLocations,
  rcConnections,
  rcUsage,
  rcAuditLogs,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { postReplyToGoogle } from '@/lib/services/google-reply';

type RouteContext = {
  params: Promise<{ reviewId: string }>;
};

/**
 * POST /api/v1/replies/[reviewId]
 * Post a reply to Google Business Profile
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const { reviewId } = await context.params;
    const reviewIdNum = parseInt(reviewId);
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Reply text is required' },
        { status: 400 }
      );
    }

    // Check quota before proceeding
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageData = await db
      .select()
      .from(rcUsage)
      .where(
        and(
          eq(rcUsage.teamId, team.id),
          eq(rcUsage.month, currentMonth)
        )
      )
      .limit(1);

    const usage = usageData[0];
    if (usage && usage.postsCount >= usage.quotaLimit) {
      return NextResponse.json(
        {
          error: 'Monthly quota exceeded',
          message: `You have reached your limit of ${usage.quotaLimit} replies per month.`,
        },
        { status: 429 }
      );
    }

    // Fetch the review with location
    const reviewData = await db
      .select({
        review: rcReviews,
        location: rcLocations,
      })
      .from(rcReviews)
      .leftJoin(rcLocations, eq(rcReviews.locationId, rcLocations.id))
      .where(
        and(
          eq(rcReviews.id, reviewIdNum),
          eq(rcReviews.teamId, team.id)
        )
      )
      .limit(1);

    if (reviewData.length === 0 || !reviewData[0].location) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    const { review, location } = reviewData[0];

    // Check if already replied (idempotency)
    const existingReply = await db
      .select()
      .from(rcReplies)
      .where(eq(rcReplies.reviewId, reviewIdNum))
      .limit(1);

    if (existingReply.length > 0) {
      return NextResponse.json(
        {
          error: 'Reply already posted',
          reply: existingReply[0],
        },
        { status: 400 }
      );
    }

    // Get connection for OAuth tokens
    const connection = await db
      .select()
      .from(rcConnections)
      .where(
        and(
          eq(rcConnections.teamId, team.id),
          eq(rcConnections.status, 'active')
        )
      )
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: 'No active Google connection found' },
        { status: 400 }
      );
    }

    // Post reply to Google Business Profile
    try {
      const googleReply = await postReplyToGoogle({
        reviewName: review.googleReviewId,
        locationId: location.googleLocationId,
        replyText: text,
        connection: connection[0],
      });

      // Insert reply into database
      const [newReply] = await db
        .insert(rcReplies)
        .values({
          reviewId: reviewIdNum,
          teamId: team.id,
          replyText: text,
          postedBy: user.id,
          googleReplyId: googleReply.replyId,
          googleUpdateTime: googleReply.updateTime,
        })
        .returning();

      // Update review status
      await db
        .update(rcReviews)
        .set({
          replied: true,
          status: 'posted',
          updatedAt: new Date(),
        })
        .where(eq(rcReviews.id, reviewIdNum));

      // Increment usage count
      if (usage) {
        await db
          .update(rcUsage)
          .set({
            postsCount: sql`${rcUsage.postsCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(rcUsage.id, usage.id));
      } else {
        await db.insert(rcUsage).values({
          teamId: team.id,
          month: currentMonth,
          postsCount: 1,
          draftsCount: 0,
          quotaLimit: 100,
        });
      }

      // Create audit log
      await db.insert(rcAuditLogs).values({
        teamId: team.id,
        userId: user.id,
        action: 'REPLY_POSTED',
        entityType: 'reply',
        entityId: newReply.id,
        newValue: {
          reviewId: reviewIdNum,
          replyText: text,
          googleReplyId: googleReply.replyId,
        },
        metadata: {
          locationId: location.id,
          locationName: location.name,
          reviewRating: review.starRating,
        },
      });

      return NextResponse.json({
        reply: newReply,
        message: 'Reply posted successfully',
      });
    } catch (googleError) {
      console.error('Error posting to Google:', googleError);
      
      // Handle specific Google API errors
      if (googleError instanceof Error) {
        if (googleError.message.includes('403')) {
          return NextResponse.json(
            {
              error: 'Location not verified',
              message: 'This location is not verified and cannot receive replies.',
            },
            { status: 403 }
          );
        }
        if (googleError.message.includes('429')) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Google API rate limit reached. Please try again later.',
            },
            { status: 429 }
          );
        }
      }

      throw googleError;
    }
  } catch (error) {
    console.error('Error posting reply:', error);
    return NextResponse.json(
      {
        error: 'Failed to post reply',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
