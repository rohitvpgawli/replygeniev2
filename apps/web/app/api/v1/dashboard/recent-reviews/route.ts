import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcReviews, rcLocations } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function GET() {
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

    // Fetch recent reviews with location data
    const reviews = await db
      .select({
        review: rcReviews,
        location: rcLocations,
      })
      .from(rcReviews)
      .leftJoin(rcLocations, eq(rcReviews.locationId, rcLocations.id))
      .where(eq(rcReviews.teamId, team.id))
      .orderBy(desc(rcReviews.reviewCreateTime))
      .limit(5);

    // Transform the data
    const transformedReviews = reviews.map(({ review, location }) => ({
      ...review,
      location,
    }));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error fetching recent reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent reviews' },
      { status: 500 }
    );
  }
}
