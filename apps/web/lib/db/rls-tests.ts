/**
 * RLS (Row-Level Security) Test Suite
 * 
 * Tests to verify tenant isolation is working correctly
 * Run these tests after enabling RLS policies
 */

import { db } from './drizzle';
import { rcLocations, rcReviews, rcDrafts, rcReplies, rcConnections } from './schema';
import { setTeamContext, clearTeamContext } from './rls-middleware';
import { eq } from 'drizzle-orm';

type TestResult = {
  name: string;
  passed: boolean;
  error?: string;
};

/**
 * Test that users can only see their team's data
 */
export async function testTeamIsolation(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Test 1: Set team context and query locations
    await setTeamContext(1);
    const team1Locations = await db.select().from(rcLocations);
    
    // All locations should belong to team 1
    const allTeam1 = team1Locations.every((loc) => loc.teamId === 1);
    results.push({
      name: 'Team 1 can only see team 1 locations',
      passed: allTeam1,
      error: allTeam1 ? undefined : 'Found locations from other teams',
    });

    // Test 2: Switch to team 2
    await setTeamContext(2);
    const team2Locations = await db.select().from(rcLocations);
    
    const allTeam2 = team2Locations.every((loc) => loc.teamId === 2);
    results.push({
      name: 'Team 2 can only see team 2 locations',
      passed: allTeam2,
      error: allTeam2 ? undefined : 'Found locations from other teams',
    });

    // Test 3: No overlap between teams
    const team1Ids = new Set(team1Locations.map((l) => l.id));
    const team2Ids = new Set(team2Locations.map((l) => l.id));
    const hasOverlap = [...team1Ids].some((id) => team2Ids.has(id));
    
    results.push({
      name: 'No data overlap between teams',
      passed: !hasOverlap,
      error: hasOverlap ? 'Found overlapping data between teams' : undefined,
    });

    // Test 4: Without team context, should see no data
    await clearTeamContext();
    const noContextLocations = await db.select().from(rcLocations);
    
    results.push({
      name: 'No team context returns no data',
      passed: noContextLocations.length === 0,
      error: noContextLocations.length > 0 ? 'Data visible without team context' : undefined,
    });

  } catch (error) {
    results.push({
      name: 'Team isolation test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return results;
}

/**
 * Test that users cannot insert data for other teams
 */
export async function testInsertIsolation(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Set context to team 1
    await setTeamContext(1);

    // Try to insert location for team 2 (should fail)
    let insertFailed = false;
    try {
      await db.insert(rcLocations).values({
        teamId: 2, // Different team!
        connectionId: 1, // Assuming connection exists
        googleLocationId: 'test-location-rls',
        name: 'Test Location',
        address: '123 Test St',
      });
    } catch (error) {
      insertFailed = true;
    }

    results.push({
      name: 'Cannot insert data for other teams',
      passed: insertFailed,
      error: insertFailed ? undefined : 'Was able to insert data for another team',
    });

    // Clean up if insert somehow succeeded
    if (!insertFailed) {
      await setTeamContext(2);
      await db.delete(rcLocations).where(eq(rcLocations.googleLocationId, 'test-location-rls'));
    }

  } catch (error) {
    results.push({
      name: 'Insert isolation test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await clearTeamContext();
  }

  return results;
}

/**
 * Test that users cannot update data for other teams
 */
export async function testUpdateIsolation(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Get a location from team 1
    await setTeamContext(1);
    const team1Locations = await db.select().from(rcLocations).limit(1);
    
    if (team1Locations.length === 0) {
      results.push({
        name: 'Update isolation test',
        passed: true,
        error: 'Skipped - no team 1 locations to test',
      });
      return results;
    }

    const locationId = team1Locations[0].id;

    // Switch to team 2 and try to update team 1's location
    await setTeamContext(2);
    
    let updateFailed = false;
    try {
      await db
        .update(rcLocations)
        .set({ name: 'Hacked Name' })
        .where(eq(rcLocations.id, locationId));
      
      // Check if update actually happened
      const updated = await db
        .select()
        .from(rcLocations)
        .where(eq(rcLocations.id, locationId));
      
      updateFailed = updated.length === 0; // Should not see the record
    } catch (error) {
      updateFailed = true;
    }

    results.push({
      name: 'Cannot update data for other teams',
      passed: updateFailed,
      error: updateFailed ? undefined : 'Was able to update another team\'s data',
    });

  } catch (error) {
    results.push({
      name: 'Update isolation test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await clearTeamContext();
  }

  return results;
}

/**
 * Test that users cannot delete data for other teams
 */
export async function testDeleteIsolation(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  try {
    // Create a test location for team 1
    await setTeamContext(1);
    const [testLocation] = await db.insert(rcLocations).values({
      teamId: 1,
      connectionId: 1, // Assuming connection exists
      googleLocationId: 'test-delete-rls',
      name: 'Test Delete Location',
      address: '123 Test St',
    }).returning();

    // Switch to team 2 and try to delete team 1's location
    await setTeamContext(2);
    
    let deleteFailed = false;
    try {
      await db.delete(rcLocations).where(eq(rcLocations.id, testLocation.id));
      
      // Check if delete actually happened
      await setTeamContext(1);
      const stillExists = await db
        .select()
        .from(rcLocations)
        .where(eq(rcLocations.id, testLocation.id));
      
      deleteFailed = stillExists.length > 0; // Should still exist
    } catch (error) {
      deleteFailed = true;
    }

    results.push({
      name: 'Cannot delete data for other teams',
      passed: deleteFailed,
      error: deleteFailed ? undefined : 'Was able to delete another team\'s data',
    });

    // Clean up
    await setTeamContext(1);
    await db.delete(rcLocations).where(eq(rcLocations.id, testLocation.id));

  } catch (error) {
    results.push({
      name: 'Delete isolation test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } finally {
    await clearTeamContext();
  }

  return results;
}

/**
 * Run all RLS tests
 */
export async function runAllRLSTests(): Promise<{
  passed: number;
  failed: number;
  results: TestResult[];
}> {
  console.log('🧪 Running RLS tests...\n');

  const allResults: TestResult[] = [];

  // Run all test suites
  const isolationResults = await testTeamIsolation();
  const insertResults = await testInsertIsolation();
  const updateResults = await testUpdateIsolation();
  const deleteResults = await testDeleteIsolation();

  allResults.push(...isolationResults, ...insertResults, ...updateResults, ...deleteResults);

  // Count results
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  // Print results
  console.log('Test Results:');
  console.log('='.repeat(60));
  
  allResults.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('='.repeat(60));
  console.log(`\nPassed: ${passed}/${allResults.length}`);
  console.log(`Failed: ${failed}/${allResults.length}\n`);

  return { passed, failed, results: allResults };
}
