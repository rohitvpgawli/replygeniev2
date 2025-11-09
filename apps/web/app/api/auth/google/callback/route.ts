import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setSession } from '@/lib/auth/session';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
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
        `${process.env.BASE_URL}/sign-in?error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/sign-in?error=invalid_request`
      );
    }

    // Verify state parameter
    let stateData: { timestamp: number; type: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      
      // Check if state is not older than 10 minutes
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        throw new Error('State expired');
      }

      if (stateData.type !== 'signin') {
        throw new Error('Invalid state type');
      }
    } catch (err) {
      console.error('Invalid state parameter:', err);
      return NextResponse.redirect(
        `${process.env.BASE_URL}/sign-in?error=invalid_state`
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.BASE_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.BASE_URL}/sign-in?error=token_exchange_failed`
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info');
      return NextResponse.redirect(
        `${process.env.BASE_URL}/sign-in?error=userinfo_failed`
      );
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    if (!userInfo.verified_email) {
      return NextResponse.redirect(
        `${process.env.BASE_URL}/sign-in?error=email_not_verified`
      );
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userInfo.email))
      .limit(1);

    let user: typeof existingUser;

    if (existingUser) {
      // User exists, sign them in
      user = existingUser;

      // Get their team
      const [membership] = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.id))
        .limit(1);

      if (!membership) {
        return NextResponse.redirect(
          `${process.env.BASE_URL}/sign-in?error=no_team`
        );
      }
    } else {
      // New user, create account
      // Create team first
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: `${userInfo.name}'s Team`,
        })
        .returning();

      // Create user (no password for OAuth users)
      const [newUser] = await db
        .insert(users)
        .values({
          email: userInfo.email,
          name: userInfo.name,
          passwordHash: '', // OAuth users don't have passwords
          role: 'owner',
        })
        .returning();

      user = newUser;

      // Create team membership
      await db.insert(teamMembers).values({
        userId: user.id,
        teamId: newTeam.id,
        role: 'owner',
      });
    }

    // Create session
    await setSession(user);

    // Redirect to dashboard
    return NextResponse.redirect(`${process.env.BASE_URL}/app/dashboard`);
  } catch (error) {
    console.error('Error in Google Sign-In callback:', error);
    return NextResponse.redirect(
      `${process.env.BASE_URL}/sign-in?error=server_error`
    );
  }
}
