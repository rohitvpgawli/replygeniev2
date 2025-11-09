import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
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

    return NextResponse.json({
      name: teamData.name,
      createdAt: teamData.createdAt,
      memberCount: memberCountResult.count,
    });
  } catch (error) {
    console.error('Error fetching team info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team info' },
      { status: 500 }
    );
  }
}
