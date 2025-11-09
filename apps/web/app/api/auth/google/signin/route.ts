import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BASE_URL}/api/auth/google/callback`;

    if (!clientId || !redirectUri) {
      console.error('Missing Google OAuth configuration');
      return NextResponse.redirect(`${process.env.BASE_URL}/sign-in?error=config_error`);
    }

    // Generate state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        timestamp: Date.now(),
        type: 'signin',
      })
    ).toString('base64');

    // Build OAuth URL
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'online', // We don't need refresh token for sign-in
      prompt: 'select_account',
      state,
    });

    const authUrl = `${GOOGLE_OAUTH_URL}?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Google Sign-In:', error);
    return NextResponse.redirect(`${process.env.BASE_URL}/sign-in?error=server_error`);
  }
}
