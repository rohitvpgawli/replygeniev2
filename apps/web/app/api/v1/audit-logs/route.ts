import { NextRequest, NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { rcAuditLogs, users } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, like } from 'drizzle-orm';

/**
 * GET /api/v1/audit-logs
 * 
 * Fetch audit logs for the team with optional filters
 * 
 * Query params:
 * - action: Filter by action type
 * - entityType: Filter by entity type
 * - userId: Filter by user ID
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - limit: Number of records (default 50, max 200)
 * - offset: Pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json(
        { error: 'No team found' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const userIdFilter = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where conditions
    const conditions = [eq(rcAuditLogs.teamId, team.id)];

    if (action) {
      conditions.push(like(rcAuditLogs.action, `%${action}%`));
    }

    if (entityType) {
      conditions.push(eq(rcAuditLogs.entityType, entityType));
    }

    if (userIdFilter) {
      conditions.push(eq(rcAuditLogs.userId, parseInt(userIdFilter)));
    }

    if (startDate) {
      conditions.push(gte(rcAuditLogs.timestamp, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(rcAuditLogs.timestamp, new Date(endDate)));
    }

    // Fetch audit logs with user info
    const logs = await db
      .select({
        id: rcAuditLogs.id,
        action: rcAuditLogs.action,
        entityType: rcAuditLogs.entityType,
        entityId: rcAuditLogs.entityId,
        oldValue: rcAuditLogs.oldValue,
        newValue: rcAuditLogs.newValue,
        metadata: rcAuditLogs.metadata,
        ipAddress: rcAuditLogs.ipAddress,
        userAgent: rcAuditLogs.userAgent,
        timestamp: rcAuditLogs.timestamp,
        userId: rcAuditLogs.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(rcAuditLogs)
      .leftJoin(users, eq(rcAuditLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(rcAuditLogs.timestamp))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalResult = await db
      .select({ count: rcAuditLogs.id })
      .from(rcAuditLogs)
      .where(and(...conditions));

    return NextResponse.json({
      logs,
      pagination: {
        total: totalResult.length,
        limit,
        offset,
        hasMore: totalResult.length > offset + limit,
      },
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
