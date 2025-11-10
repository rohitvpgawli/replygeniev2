import { NextRequest, NextResponse } from 'next/server';
import { withExtensionAuth } from '@/lib/auth/extension-middleware';
import { db } from '@/lib/db/drizzle';
import { rcReviews, rcLocations, rcDrafts, rcUsage, teams } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateDraft } from '@/lib/services/draft-generation';

/**
 * POST /api/extension/draft
 * 
 * Generate a draft reply for a review (used by Chrome extension)
 * Requires extension JWT in Authorization header
 * 
 * Request body:
 * {
 *   reviewId?: number,  // If review exists in our DB
 *   reviewText?: string, // Raw review text from GBP page
 *   starRating?: number, // 1-5
 *   locationId?: number  // If location exists in our DB
 * }
 * 
 * Response:
 * {
 *   draft: string,
 *   wordCount: number,
 *   charCount: number,
 *   riskFlags: { ... }
 * }
 */
export const POST = withExtensionAuth(async (request, context) => {
  try {
    const body = await request.json();
    const { reviewId, reviewText, starRating, locationId } = body;

    // Get team info for brand voice
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, context.teamId),
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check quota
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const usage = await db.query.rcUsage.findFirst({
      where: and(
        eq(rcUsage.teamId, context.teamId),
        eq(rcUsage.month, currentMonth)
      ),
    });

    const quotaLimit = usage?.quotaLimit || 50;
    const draftsCount = usage?.draftsCount || 0;

    if (draftsCount >= quotaLimit) {
      return NextResponse.json(
        { error: 'Monthly draft quota exceeded' },
        { status: 429 }
      );
    }

    let review;
    let location;

    // If reviewId provided, fetch from DB
    if (reviewId) {
      review = await db.query.rcReviews.findFirst({
        where: and(
          eq(rcReviews.id, reviewId),
          eq(rcReviews.teamId, context.teamId)
        ),
      });

      if (!review) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }

      location = await db.query.rcLocations.findFirst({
        where: eq(rcLocations.id, review.locationId),
      });
    } else if (reviewText && starRating) {
      // Create temporary review object for draft generation
      review = {
        id: 0,
        comment: reviewText,
        starRating,
        reviewerDisplayName: 'Customer',
        reviewCreateTime: new Date(),
        teamId: context.teamId,
        locationId: locationId || 0,
      } as any;

      if (locationId) {
        location = await db.query.rcLocations.findFirst({
          where: and(
            eq(rcLocations.id, locationId),
            eq(rcLocations.teamId, context.teamId)
          ),
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Either reviewId or (reviewText + starRating) required' },
        { status: 400 }
      );
    }

    if (!location) {
      // Use a default location name if not found
      location = {
        id: 0,
        locationName: team.name || 'Our Business',
        teamId: context.teamId,
      } as any;
    }

    // Generate draft
    const result = await generateDraft({
      review,
      location,
      brandVoice: team.brandVoiceGuidance || undefined,
      contactChannel: team.contactChannel || undefined,
    });

    // If this is a real review, save draft and increment usage
    if (reviewId && reviewId > 0) {
      // Delete existing draft if any
      await db.delete(rcDrafts).where(eq(rcDrafts.reviewId, reviewId));

      // Insert new draft
      await db.insert(rcDrafts).values({
        reviewId,
        teamId: context.teamId,
        draftText: result.text,
        wordCount: result.wordCount,
        charCount: result.charCount,
        riskFlags: result.riskFlags,
        generatedBy: 'ai',
        generatedAt: new Date(),
      });

      // Increment drafts count
      if (usage) {
        await db
          .update(rcUsage)
          .set({ draftsCount: draftsCount + 1 })
          .where(eq(rcUsage.id, usage.id));
      } else {
        await db.insert(rcUsage).values({
          teamId: context.teamId,
          month: currentMonth,
          draftsCount: 1,
          postsCount: 0,
          quotaLimit,
        });
      }
    }

    return NextResponse.json({
      draft: result.text,
      wordCount: result.wordCount,
      charCount: result.charCount,
      riskFlags: result.riskFlags,
    });
  } catch (error) {
    console.error('Extension draft generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    );
  }
});
