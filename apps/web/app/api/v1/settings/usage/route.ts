import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcUsage } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

/**
 * GET /api/v1/settings/usage
 * Get current month's usage data for the team
 */
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

    // Get current month in YYYY-MM format
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Fetch usage data for current month
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

    if (usageData.length === 0) {
      // No usage data yet for this month - return defaults
      return NextResponse.json({
        draftsCount: 0,
        postsCount: 0,
        quotaLimit: 50,
        month: currentMonth,
      });
    }

    const usage = usageData[0];

    return NextResponse.json({
      draftsCount: usage.draftsCount,
      postsCount: usage.postsCount,
      quotaLimit: usage.quotaLimit,
      month: usage.month,
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
