import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcConnections, rcAuditLogs } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { encryptToken } from '@/lib/encryption';
import { eq, and } from 'drizzle-orm';
import { fetchAccounts } from '@/lib/google/gbp-client';
import { syncLocations } from '@/lib/services/review-sync';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=invalid_request`
      );
    }

    // Verify state parameter
    let stateData: { userId: number; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      
      // Check if state is not older than 10 minutes
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error('State expired');
      }
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=invalid_state`
      );
    }

    // Verify user is authenticated and matches state
    const user = await getUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=unauthorized`
      );
    }

    // Get user's team
    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=no_team`
      );
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT!;
    
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=token_exchange_failed`
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    if (!tokens.refresh_token) {
      console.error('No refresh token received');
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=no_refresh_token`
      );
    }

    // Encrypt tokens
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);

    if (!encryptedAccessToken || !encryptedRefreshToken) {
      console.error('Failed to encrypt tokens');
      return NextResponse.redirect(
        `${process.env.BASE_URL}/app/settings/integrations?error=encryption_failed`
      );
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Check if connection already exists for this team
    const existingConnection = await db
      .select()
      .from(rcConnections)
      .where(
        and(
          eq(rcConnections.teamId, team.id),
          eq(rcConnections.provider, 'google')
        )
      )
      .limit(1);

    if (existingConnection.length > 0) {
      // Update existing connection
      await db
        .update(rcConnections)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt,
          scope: tokens.scope,
          connectedBy: user.id,
          connectedAt: new Date(),
          status: 'active',
        })
        .where(eq(rcConnections.id, existingConnection[0].id));

      // Create audit log
      await db.insert(rcAuditLogs).values({
        teamId: team.id,
        userId: user.id,
        action: 'CONNECTION_UPDATED',
        entityType: 'connection',
        entityId: existingConnection[0].id,
        metadata: { provider: 'google' },
      });
    } else {
      // Create new connection
      const [newConnection] = await db
        .insert(rcConnections)
        .values({
          teamId: team.id,
          provider: 'google',
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenExpiresAt,
          scope: tokens.scope,
          connectedBy: user.id,
          connectedAt: new Date(),
          status: 'active',
        })
        .returning();

      // Create audit log
      await db.insert(rcAuditLogs).values({
        teamId: team.id,
        userId: user.id,
        action: 'CONNECTION_CREATED',
        entityType: 'connection',
        entityId: newConnection.id,
        metadata: { provider: 'google' },
      });
    }

    // Auto-sync locations after successful connection
    try {
      const accounts = await fetchAccounts(tokens.access_token);
      if (accounts.length > 0) {
        const accountId = accounts[0].name.split('/')[1];
        await syncLocations(team.id, user.id, accountId);
      }
    } catch (syncError) {
      console.error('Error auto-syncing locations:', syncError);
      // Don't fail the OAuth flow if sync fails - user can manually sync later
    }

    // Redirect to integrations page with success message
    return NextResponse.redirect(
      `${process.env.BASE_URL}/app/settings/integrations?success=connected`
    );
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return NextResponse.redirect(
      `${process.env.BASE_URL}/app/settings/integrations?error=server_error`
    );
  }
}
