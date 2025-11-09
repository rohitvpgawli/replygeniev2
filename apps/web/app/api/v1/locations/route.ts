import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { rcLocations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
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

    // Fetch all locations for the team
    const locations = await db
      .select({
        id: rcLocations.id,
        googleLocationId: rcLocations.googleLocationId,
        name: rcLocations.name,
        address: rcLocations.address,
        phoneNumber: rcLocations.phoneNumber,
        websiteUrl: rcLocations.websiteUrl,
        isVerified: rcLocations.isVerified,
        lastSyncAt: rcLocations.lastSyncAt,
        createdAt: rcLocations.createdAt,
      })
      .from(rcLocations)
      .where(eq(rcLocations.teamId, team.id))
      .orderBy(rcLocations.name);

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
