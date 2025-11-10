import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getTeamForUser } from '@/lib/db/queries';
import { signExtensionToken } from '@/lib/auth/extension-jwt';

/**
 * POST /api/extension/auth
 * 
 * Issues a short-lived JWT (15 min) for Chrome extension
 * Requires valid user session cookie
 * 
 * Response:
 * {
 *   token: string,
 *   expiresIn: number (seconds),
 *   teamId: number,
 *   userId: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - no valid session' },
        { status: 401 }
      );
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json(
        { error: 'No team found for user' },
        { status: 403 }
      );
    }

    // Generate short-lived JWT
    const token = await signExtensionToken(user.id, team.id);

    return NextResponse.json({
      token,
      expiresIn: 900, // 15 minutes in seconds
      teamId: team.id,
      userId: user.id,
    });
  } catch (error) {
    console.error('Extension auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
