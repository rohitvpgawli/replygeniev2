import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { syncLocations } from '@/lib/services/review-sync';
import { fetchAccounts } from '@/lib/google/gbp-client';
import { getValidAccessToken } from '@/lib/google/oauth';

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

    // Get valid access token
    const accessToken = await getValidAccessToken(team.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid access token. Please reconnect your Google account.' },
        { status: 401 }
      );
    }

    // Fetch accounts
    const accounts = await fetchAccounts(accessToken);
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No Google Business accounts found' },
        { status: 404 }
      );
    }

    // Use the first account (most common case)
    // Extract account ID from name format: "accounts/{accountId}"
    const accountId = accounts[0].name.split('/')[1];

    // Sync locations
    const result = await syncLocations(team.id, user.id, accountId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to sync locations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Error in locations sync endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
