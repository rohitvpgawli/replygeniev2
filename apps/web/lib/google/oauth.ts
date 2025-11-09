import { db } from '@/lib/db/drizzle';
import { rcConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptToken, encryptToken } from '@/lib/encryption';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/**
 * Gets a valid access token for a team's Google connection
 * Automatically refreshes if expired
 */
export async function getValidAccessToken(teamId: number): Promise<string | null> {
  try {
    // Get the connection
    const [connection] = await db
      .select()
      .from(rcConnections)
      .where(
        and(
          eq(rcConnections.teamId, teamId),
          eq(rcConnections.provider, 'google'),
          eq(rcConnections.status, 'active')
        )
      )
      .limit(1);

    if (!connection) {
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    const now = new Date();
    const expiryWithBuffer = new Date(
      connection.tokenExpiresAt!.getTime() - 5 * 60 * 1000
    );

    if (now < expiryWithBuffer) {
      // Token is still valid, decrypt and return
      return decryptToken(connection.accessToken);
    }

    // Token expired, refresh it
    const refreshToken = decryptToken(connection.refreshToken);
    if (!refreshToken) {
      console.error('No refresh token available');
      return null;
    }

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', errorData);
      
      // Mark connection as inactive if refresh fails
      await db
        .update(rcConnections)
        .set({ status: 'inactive' })
        .where(eq(rcConnections.id, connection.id));
      
      return null;
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Encrypt new access token
    const encryptedAccessToken = encryptToken(tokens.access_token);
    if (!encryptedAccessToken) {
      console.error('Failed to encrypt new access token');
      return null;
    }

    // Calculate new expiry
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Update connection with new token
    await db
      .update(rcConnections)
      .set({
        accessToken: encryptedAccessToken,
        tokenExpiresAt,
        scope: tokens.scope,
      })
      .where(eq(rcConnections.id, connection.id));

    return tokens.access_token;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    return null;
  }
}

/**
 * Refreshes an access token using a refresh token
 * Returns the new access token and expiry time
 */
export async function refreshAccessToken(encryptedRefreshToken: string): Promise<{
  accessToken: string;
  expiresAt: Date;
}> {
  const refreshToken = decryptToken(encryptedRefreshToken);
  if (!refreshToken) {
    throw new Error('Invalid refresh token');
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Token refresh failed: ${errorData}`);
  }

  const tokens: GoogleTokenResponse = await tokenResponse.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  return {
    accessToken: tokens.access_token,
    expiresAt,
  };
}

/**
 * Checks if a team has an active Google connection
 */
export async function hasActiveConnection(teamId: number): Promise<boolean> {
  const [connection] = await db
    .select()
    .from(rcConnections)
    .where(
      and(
        eq(rcConnections.teamId, teamId),
        eq(rcConnections.provider, 'google'),
        eq(rcConnections.status, 'active')
      )
    )
    .limit(1);

  return !!connection;
}

/**
 * Gets connection status for a team
 */
export async function getConnectionStatus(teamId: number) {
  const [connection] = await db
    .select({
      id: rcConnections.id,
      status: rcConnections.status,
      connectedAt: rcConnections.connectedAt,
      lastSyncAt: rcConnections.lastSyncAt,
    })
    .from(rcConnections)
    .where(
      and(
        eq(rcConnections.teamId, teamId),
        eq(rcConnections.provider, 'google')
      )
    )
    .limit(1);

  return connection || null;
}
