import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.email',
];

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT;

    if (!clientId || !redirectUri) {
      console.error('Missing Google OAuth configuration');
      return NextResponse.json(
        { error: 'OAuth configuration error' },
        { status: 500 }
      );
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error starting OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}
