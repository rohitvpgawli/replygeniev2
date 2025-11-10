import { NextRequest, NextResponse } from 'next/server';
import { verifyExtensionToken, extractBearerToken, ExtensionJWTPayload } from './extension-jwt';

export type ExtensionAuthContext = {
  userId: number;
  teamId: number;
};

/**
 * Middleware to verify extension JWT from Authorization header
 * Returns the decoded payload or null if invalid
 */
export async function verifyExtensionAuth(
  request: NextRequest
): Promise<ExtensionAuthContext | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return null;
    }

    const payload = await verifyExtensionToken(token);
    return {
      userId: payload.userId,
      teamId: payload.teamId,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Higher-order function to wrap extension API routes with auth
 * Usage:
 * 
 * export const POST = withExtensionAuth(async (request, context) => {
 *   // context.userId and context.teamId are available
 *   return NextResponse.json({ ... });
 * });
 */
export function withExtensionAuth(
  handler: (request: NextRequest, context: ExtensionAuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context = await verifyExtensionAuth(request);

    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid or expired token' },
        { status: 401 }
      );
    }

    return handler(request, context);
  };
}
