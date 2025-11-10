import { SignJWT, jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export type ExtensionJWTPayload = {
  userId: number;
  teamId: number;
  type: 'extension';
  exp: number;
  iat: number;
};

/**
 * Sign a short-lived JWT for Chrome extension (15 min expiry)
 */
export async function signExtensionToken(userId: number, teamId: number): Promise<string> {
  return await new SignJWT({ userId, teamId, type: 'extension' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15 minutes')
    .sign(key);
}

/**
 * Verify extension JWT and return payload
 */
export async function verifyExtensionToken(token: string): Promise<ExtensionJWTPayload> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    // Validate payload structure
    if (
      typeof payload.userId !== 'number' ||
      typeof payload.teamId !== 'number' ||
      payload.type !== 'extension'
    ) {
      throw new Error('Invalid token payload');
    }

    return payload as ExtensionJWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
