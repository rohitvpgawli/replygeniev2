import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { getConnectionStatus } from '@/lib/google/oauth';

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

    // Get connection status
    const status = await getConnectionStatus(team.id);

    if (!status) {
      return NextResponse.json({
        connected: false,
      });
    }

    return NextResponse.json({
      connected: status.status === 'active',
      connectedAt: status.connectedAt?.toISOString(),
      lastSyncAt: status.lastSyncAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching connection status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connection status' },
      { status: 500 }
    );
  }
}
