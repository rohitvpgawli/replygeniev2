import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { rcConnections, rcLocations } from '@/lib/db/schema';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { decryptToken } from '@/lib/encryption';
import { fetchAccounts, fetchLocations } from '@/lib/google/gbp-client';

/**
 * DEBUG endpoint to check connection status and GBP API calls
 * Remove this in production
 */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Check database connection
    const [connection] = await db
      .select()
      .from(rcConnections)
      .where(eq(rcConnections.teamId, team.id))
      .limit(1);

    if (!connection) {
      return NextResponse.json({
        status: 'no_connection',
        message: 'No Google connection found in database',
      });
    }

    // Check locations in database
    const locations = await db
      .select()
      .from(rcLocations)
      .where(eq(rcLocations.teamId, team.id));

    // Decrypt and test access token
    let accountsFromAPI = null;
    let locationsFromAPI = null;
    let apiError = null;
    let rawApiResponse = null;

    try {
      const accessToken = decryptToken(connection.accessToken);
      if (!accessToken) {
        throw new Error('Failed to decrypt access token');
      }

      // Test raw API call to see exact error
      const testResponse = await fetch(`https://mybusinessaccountmanagement.googleapis.com/v1/accounts`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      rawApiResponse = {
        status: testResponse.status,
        statusText: testResponse.statusText,
        body: await testResponse.text(),
      };

      if (!testResponse.ok) {
        throw new Error(`API returned ${testResponse.status}: ${rawApiResponse.body}`);
      }

      // Test fetchAccounts
      const accounts = await fetchAccounts(accessToken);
      accountsFromAPI = accounts.map(acc => ({
        name: acc.name,
        accountName: acc.accountName,
        type: acc.type,
      }));

      // Test fetchLocations if we have an account
      if (accounts.length > 0) {
        const accountId = accounts[0].name.split('/')[1];
        const locs = await fetchLocations(accessToken, accountId);
        locationsFromAPI = locs.map(loc => ({
          name: loc.name,
          locationName: loc.locationName,
          isVerified: loc.locationState?.isVerified,
          address: loc.storefrontAddress,
        }));
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      status: 'connected',
      team: {
        id: team.id,
        name: team.name,
      },
      connection: {
        id: connection.id,
        provider: connection.provider,
        status: connection.status,
        connectedAt: connection.connectedAt,
        tokenExpiresAt: connection.tokenExpiresAt,
        scope: connection.scope,
      },
      locationsInDB: locations.length,
      locationsDetails: locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        googleLocationId: loc.googleLocationId,
        isVerified: loc.isVerified,
      })),
      apiTest: {
        accountsFromAPI,
        locationsFromAPI,
        error: apiError,
        rawApiResponse,
      },
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
