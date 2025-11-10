/**
 * Structured Logger for ReplyGenie
 * 
 * Provides consistent logging across the application with:
 * - Structured JSON output
 * - Log levels (debug, info, warn, error)
 * - Context enrichment (teamId, userId, requestId)
 * - Performance tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = {
  teamId?: number;
  userId?: number;
  requestId?: string;
  [key: string]: any;
};

class Logger {
  private context: LogContext = {};

  /**
   * Set global context for all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Log a message with level and optional context
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    };

    // In production, send to logging service (e.g., Datadog, LogRocket)
    // For now, use console with structured output
    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(output);
        }
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  /**
   * Debug level - verbose information for development
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  /**
   * Info level - general informational messages
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  /**
   * Warn level - warning messages that don't prevent operation
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  /**
   * Error level - error messages that indicate failures
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    const errorMeta = {
      ...meta,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    };
    this.log('error', message, errorMeta);
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.setContext({ ...this.context, ...context });
    return childLogger;
  }

  /**
   * Measure execution time of an operation
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    meta?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    this.debug(`Starting: ${operation}`, meta);

    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.info(`Completed: ${operation}`, { ...meta, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.error(`Failed: ${operation}`, error, { ...meta, duration });
      throw error;
    }
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, meta?: Record<string, any>): void {
    this.info('API Request', { method, path, ...meta });
  }

  /**
   * Log API response
   */
  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    meta?: Record<string, any>
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.log(level, 'API Response', {
      method,
      path,
      statusCode,
      duration,
      ...meta,
    });
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration?: number, meta?: Record<string, any>): void {
    this.debug('Database Query', { query, duration, ...meta });
  }

  /**
   * Log external API call
   */
  externalApi(service: string, endpoint: string, meta?: Record<string, any>): void {
    this.info('External API Call', { service, endpoint, ...meta });
  }

  /**
   * Log authentication event
   */
  auth(event: string, userId?: number, meta?: Record<string, any>): void {
    this.info('Auth Event', { event, userId, ...meta });
  }

  /**
   * Log security event
   */
  security(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: Record<string, any>): void {
    this.warn('Security Event', { event, severity, ...meta });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };

/**
 * Example usage:
 * 
 * import { logger } from '@/lib/logger';
 * 
 * // Simple logging
 * logger.info('User logged in', { userId: 123 });
 * logger.error('Failed to fetch reviews', error, { locationId: 456 });
 * 
 * // With context
 * logger.setContext({ teamId: 1, userId: 123 });
 * logger.info('Action performed'); // Includes teamId and userId
 * 
 * // Child logger
 * const requestLogger = logger.child({ requestId: 'abc-123' });
 * requestLogger.info('Processing request');
 * 
 * // Timing
 * const result = await logger.time('fetchReviews', async () => {
 *   return await fetchReviews();
 * });
 * 
 * // API logging
 * logger.apiRequest('POST', '/api/v1/drafts/123');
 * logger.apiResponse('POST', '/api/v1/drafts/123', 200, 150);
 */
