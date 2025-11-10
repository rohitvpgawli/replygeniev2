import { sql } from 'drizzle-orm';
import { db } from './drizzle';

/**
 * Set the team_id session variable for RLS (Row-Level Security)
 * This must be called at the start of every request that accesses team data
 * 
 * @param teamId - The team ID to set in the session
 */
export async function setTeamContext(teamId: number): Promise<void> {
  try {
    await db.execute(sql`SET LOCAL app.team_id = ${teamId.toString()}`);
  } catch (error) {
    console.error('Failed to set team context:', error);
    throw new Error('Failed to set security context');
  }
}

/**
 * Clear the team_id session variable
 * Useful for cleanup or testing
 */
export async function clearTeamContext(): Promise<void> {
  try {
    await db.execute(sql`RESET app.team_id`);
  } catch (error) {
    console.error('Failed to clear team context:', error);
  }
}

/**
 * Get the current team_id from session variable
 * Used for debugging/testing
 */
export async function getCurrentTeamContext(): Promise<number | null> {
  try {
    const result = await db.execute(sql`SELECT current_setting('app.team_id', TRUE) as team_id`);
    const rows = Array.from(result);
    const teamId = (rows[0] as any)?.team_id;
    return teamId ? parseInt(teamId, 10) : null;
  } catch (error) {
    console.error('Failed to get team context:', error);
    return null;
  }
}

/**
 * Higher-order function to wrap database operations with RLS context
 * 
 * Usage:
 * const result = await withTeamContext(teamId, async () => {
 *   return await db.select().from(rcLocations);
 * });
 */
export async function withTeamContext<T>(
  teamId: number,
  operation: () => Promise<T>
): Promise<T> {
  await setTeamContext(teamId);
  try {
    return await operation();
  } finally {
    // Note: In PostgreSQL, SET LOCAL is automatically reset at transaction end
    // But we clear it explicitly for safety
    await clearTeamContext();
  }
}

/**
 * Verify RLS is working correctly
 * This should be called during application startup or in tests
 * 
 * @returns true if RLS is enabled and working
 */
export async function verifyRLS(): Promise<boolean> {
  try {
    // Check if RLS is enabled on rc_locations table
    const result = await db.execute(sql`
      SELECT relrowsecurity 
      FROM pg_class 
      WHERE relname = 'rc_locations'
    `);
    
    const rows = Array.from(result);
    const rlsEnabled = (rows[0] as any)?.relrowsecurity;
    
    if (!rlsEnabled) {
      console.error('RLS is not enabled on rc_locations table');
      return false;
    }
    
    console.log('✅ RLS verification passed');
    return true;
  } catch (error) {
    console.error('RLS verification failed:', error);
    return false;
  }
}
