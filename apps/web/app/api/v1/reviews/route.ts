import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcReviews, rcLocations, rcDrafts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get('locationId');
    const rating = searchParams.get('rating');
    const status = searchParams.get('status');

    // Build query conditions
    const conditions = [eq(rcReviews.teamId, team.id)];

    if (locationId && locationId !== 'all') {
      conditions.push(eq(rcReviews.locationId, parseInt(locationId)));
    }

    if (rating && rating !== 'all') {
      conditions.push(eq(rcReviews.starRating, parseInt(rating)));
    }

    if (status && status !== 'all') {
      if (status === 'posted') {
        conditions.push(eq(rcReviews.replied, true));
      } else {
        conditions.push(eq(rcReviews.status, status));
      }
    }

    // Fetch reviews with location and draft data
    const reviews = await db
      .select({
        review: rcReviews,
        location: rcLocations,
        draft: rcDrafts,
      })
      .from(rcReviews)
      .leftJoin(rcLocations, eq(rcReviews.locationId, rcLocations.id))
      .leftJoin(rcDrafts, eq(rcReviews.id, rcDrafts.reviewId))
      .where(and(...conditions))
      .orderBy(desc(rcReviews.reviewCreateTime))
      .limit(100);

    // Transform the data to match the expected format
    const transformedReviews = reviews.map(({ review, location, draft }) => ({
      ...review,
      location,
      draft: draft || undefined,
    }));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
