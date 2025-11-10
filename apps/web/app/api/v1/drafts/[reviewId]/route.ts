import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcDrafts, rcReviews, rcLocations, teams, rcUsage } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { generateDraft } from '@/lib/services/draft-generation';

type RouteContext = {
  params: Promise<{ reviewId: string }>;
};

/**
 * POST /api/v1/drafts/[reviewId]
 * Generate a new draft for a review
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

    // Check draft quota before proceeding
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
    if (usage && usage.draftsCount >= usage.quotaLimit) {
      return NextResponse.json(
        {
          error: 'Monthly quota exceeded',
          message: `You have reached your limit of ${usage.quotaLimit} drafts per month.`,
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

    // Check if review is already replied
    if (review.replied) {
      return NextResponse.json(
        { error: 'Review already has a reply' },
        { status: 400 }
      );
    }

    // Check if draft already exists
    const existingDraft = await db
      .select()
      .from(rcDrafts)
      .where(eq(rcDrafts.reviewId, reviewIdNum))
      .limit(1);

    if (existingDraft.length > 0) {
      return NextResponse.json(
        { error: 'Draft already exists for this review' },
        { status: 400 }
      );
    }

    // Get team settings for brand voice
    const teamData = await db
      .select()
      .from(teams)
      .where(eq(teams.id, team.id))
      .limit(1);

    const brandVoice = teamData[0]?.brandVoiceGuidance || undefined;
    const contactChannel = teamData[0]?.contactChannel || undefined;

    // Generate draft using AI
    const draftResult = await generateDraft({
      review,
      location,
      brandVoice,
      contactChannel,
    });

    // Insert draft into database
    const [newDraft] = await db
      .insert(rcDrafts)
      .values({
        reviewId: reviewIdNum,
        teamId: team.id,
        draftText: draftResult.text,
        wordCount: draftResult.wordCount,
        charCount: draftResult.charCount,
        riskFlags: draftResult.riskFlags,
        generatedBy: 'ai',
      })
      .returning();

    // Update review status to 'drafted'
    await db
      .update(rcReviews)
      .set({ status: 'drafted', updatedAt: new Date() })
      .where(eq(rcReviews.id, reviewIdNum));

    // Increment drafts count in usage
    if (usage) {
      await db
        .update(rcUsage)
        .set({
          draftsCount: sql`${rcUsage.draftsCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(rcUsage.id, usage.id));
    } else {
      await db.insert(rcUsage).values({
        teamId: team.id,
        month: currentMonth,
        draftsCount: 1,
        postsCount: 0,
        quotaLimit: 50,
      });
    }

    return NextResponse.json({
      draft: newDraft,
      message: 'Draft generated successfully',
    });
  } catch (error) {
    console.error('Error generating draft:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/drafts/[reviewId]
 * Update an existing draft
 */
export async function PATCH(
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
        { error: 'Invalid draft text' },
        { status: 400 }
      );
    }

    // Fetch the existing draft
    const existingDraft = await db
      .select()
      .from(rcDrafts)
      .where(
        and(
          eq(rcDrafts.reviewId, reviewIdNum),
          eq(rcDrafts.teamId, team.id)
        )
      )
      .limit(1);

    if (existingDraft.length === 0) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Count words and chars
    const wordCount = text.trim().split(/\s+/).length;
    const charCount = text.length;

    // Update the draft
    const [updatedDraft] = await db
      .update(rcDrafts)
      .set({
        draftText: text,
        wordCount,
        charCount,
        editedBy: user.id,
        editedAt: new Date(),
      })
      .where(eq(rcDrafts.id, existingDraft[0].id))
      .returning();

    return NextResponse.json({
      draft: updatedDraft,
      message: 'Draft updated successfully',
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/drafts/[reviewId]
 * Delete a draft (for regeneration)
 */
export async function DELETE(
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

    // Delete the draft
    await db
      .delete(rcDrafts)
      .where(
        and(
          eq(rcDrafts.reviewId, reviewIdNum),
          eq(rcDrafts.teamId, team.id)
        )
      );

    // Update review status back to 'pending'
    await db
      .update(rcReviews)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(rcReviews.id, reviewIdNum));

    return NextResponse.json({
      message: 'Draft deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
