import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { syncReviews } from '@/lib/services/review-sync';

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json(
        { error: 'No team found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { locationId } = body;

    if (!locationId || typeof locationId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid locationId' },
        { status: 400 }
      );
    }

    // Sync reviews
    const result = await syncReviews(locationId, team.id, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      newReviews: result.newReviews,
      totalReviews: result.totalReviews,
    });
  } catch (error) {
    console.error('Error in reviews sync endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
