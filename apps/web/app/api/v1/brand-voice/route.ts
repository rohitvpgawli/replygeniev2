import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser, getTeamForUser } from '@/lib/db/queries';

/**
 * GET /api/v1/brand-voice
 * Get brand voice settings for the team
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

    // Fetch team settings
    const [teamData] = await db
      .select({
        brandVoiceGuidance: teams.brandVoiceGuidance,
        contactChannel: teams.contactChannel,
      })
      .from(teams)
      .where(eq(teams.id, team.id))
      .limit(1);

    return NextResponse.json(teamData || {
      brandVoiceGuidance: null,
      contactChannel: null,
    });
  } catch (error) {
    console.error('Error fetching brand voice settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand voice settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/brand-voice
 * Update brand voice settings for the team
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { brandVoiceGuidance, contactChannel } = body;

    // Validate input
    if (brandVoiceGuidance !== null && typeof brandVoiceGuidance !== 'string') {
      return NextResponse.json(
        { error: 'Invalid brand voice guidance' },
        { status: 400 }
      );
    }

    if (contactChannel !== null && typeof contactChannel !== 'string') {
      return NextResponse.json(
        { error: 'Invalid contact channel' },
        { status: 400 }
      );
    }

    // Update team settings
    await db
      .update(teams)
      .set({
        brandVoiceGuidance: brandVoiceGuidance || null,
        contactChannel: contactChannel || null,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, team.id));

    return NextResponse.json({
      message: 'Brand voice settings updated successfully',
      brandVoiceGuidance,
      contactChannel,
    });
  } catch (error) {
    console.error('Error updating brand voice settings:', error);
    return NextResponse.json(
      { error: 'Failed to update brand voice settings' },
      { status: 500 }
    );
  }
}
