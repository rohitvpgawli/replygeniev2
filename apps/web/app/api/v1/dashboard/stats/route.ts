import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcReviews, rcReplies } from '@/lib/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
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

    // Calculate 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get needing reply count (not replied)
    const [needingReplyResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rcReviews)
      .where(
        and(
          eq(rcReviews.teamId, team.id),
          eq(rcReviews.replied, false)
        )
      );

    // Get replies posted in last 30 days
    const [repliesPosted30dResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rcReplies)
      .where(
        and(
          eq(rcReplies.teamId, team.id),
          gte(rcReplies.postedAt, thirtyDaysAgo)
        )
      );

    // Get total reviews
    const [totalReviewsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rcReviews)
      .where(eq(rcReviews.teamId, team.id));

    // Calculate average response time (simplified - can be improved)
    const repliesWithReviews = await db
      .select({
        postedAt: rcReplies.postedAt,
        reviewCreateTime: rcReviews.reviewCreateTime,
      })
      .from(rcReplies)
      .innerJoin(rcReviews, eq(rcReplies.reviewId, rcReviews.id))
      .where(
        and(
          eq(rcReplies.teamId, team.id),
          gte(rcReplies.postedAt, thirtyDaysAgo)
        )
      )
      .limit(100);

    let avgResponseTime = '—';
    if (repliesWithReviews.length > 0) {
      const totalHours = repliesWithReviews.reduce((sum, item) => {
        const diff = new Date(item.postedAt).getTime() - new Date(item.reviewCreateTime).getTime();
        return sum + diff / (1000 * 60 * 60); // Convert to hours
      }, 0);
      
      const avgHours = totalHours / repliesWithReviews.length;
      
      if (avgHours < 24) {
        avgResponseTime = `${Math.round(avgHours)}h`;
      } else {
        avgResponseTime = `${Math.round(avgHours / 24)}d`;
      }
    }

    return NextResponse.json({
      needingReply: needingReplyResult.count,
      repliesPosted30d: repliesPosted30dResult.count,
      avgResponseTime,
      totalReviews: totalReviewsResult.count,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
