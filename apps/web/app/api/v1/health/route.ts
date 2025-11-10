import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { sql } from 'drizzle-orm';
import { verifyRLS } from '@/lib/db/rls-middleware';
import { logger } from '@/lib/logger';

type HealthCheck = {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  duration?: number;
};

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      name: 'database',
      status: 'healthy',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      name: 'database',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Connection failed',
      duration: Date.now() - startTime,
    };
  }
}

async function checkRLS(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const rlsEnabled = await verifyRLS();
    return {
      name: 'rls',
      status: rlsEnabled ? 'healthy' : 'degraded',
      message: rlsEnabled ? 'RLS enabled' : 'RLS not enabled',
      duration: Date.now() - startTime,
    };
  } catch (error) {
    logger.error('RLS health check failed', error);
    return {
      name: 'rls',
      status: 'unhealthy',
      message: 'RLS check failed',
      duration: Date.now() - startTime,
    };
  }
}

async function checkEnvironment(): Promise<HealthCheck> {
  const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GEMINI_API_KEY',
    'TOKEN_ENCRYPTION_KEY',
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      name: 'environment',
      status: 'unhealthy',
      message: `Missing env vars: ${missing.join(', ')}`,
    };
  }

  return {
    name: 'environment',
    status: 'healthy',
    message: 'All required env vars present',
  };
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [dbCheck, rlsCheck, envCheck] = await Promise.all([
      checkDatabase(),
      checkRLS(),
      checkEnvironment(),
    ]);

    const checks = [dbCheck, rlsCheck, envCheck];

    // Determine overall status
    const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
    const hasDegraded = checks.some((c) => c.status === 'degraded');

    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';
    const statusCode = hasUnhealthy ? 503 : hasDegraded ? 200 : 200;

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      minClientVersion: '1.0.0',
      uptime: process.uptime(),
      checks,
      duration: Date.now() - startTime,
    };

    // Log health check
    if (overallStatus !== 'healthy') {
      logger.warn('Health check degraded or unhealthy', { response });
    }

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        duration: Date.now() - startTime,
      },
      { status: 503 }
    );
  }
}
