import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers, rcConnections } from '@/lib/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { fetchAccounts } from '@/lib/google/gbp-client';
import { refreshAccessToken } from '@/lib/google/oauth';

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

    // Fetch team details
    const [teamData] = await db
      .select({
        name: teams.name,
        createdAt: teams.createdAt,
      })
      .from(teams)
      .where(eq(teams.id, team.id))
      .limit(1);

    // Count team members
    const [memberCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));

    // Try to fetch Google Business Profile account name
    let googleAccountName: string | undefined;
    try {
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

      if (connection.length > 0) {
        let accessToken = connection[0].accessToken;
        const tokenExpiry = connection[0].tokenExpiresAt;

        // Refresh token if expired or about to expire (within 5 minutes)
        if (!tokenExpiry || new Date(tokenExpiry).getTime() - Date.now() < 5 * 60 * 1000) {
          const refreshed = await refreshAccessToken(connection[0].refreshToken!);
          accessToken = refreshed.accessToken;
        }

        // Fetch accounts from Google Business Profile
        if (accessToken) {
          const accounts = await fetchAccounts(accessToken);
          if (accounts.length > 0) {
            googleAccountName = accounts[0].accountName;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Google account name:', error);
      // Continue without Google account name if fetch fails
    }

    return NextResponse.json({
      name: teamData.name,
      createdAt: teamData.createdAt,
      memberCount: memberCountResult.count,
      googleAccountName,
    });
  } catch (error) {
    console.error('Error fetching team info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
