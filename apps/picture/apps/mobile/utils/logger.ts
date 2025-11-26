/**
 * Centralized logging utility
 * - Development: Logs to console
 * - Production: Can be integrated with Sentry, LogRocket, etc.
 */

const isDevelopment = __DEV__;

export const logger = {
  /**
   * Log debug information (only in development)
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log general information
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Log warnings (always logged)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
    // TODO: Send to error tracking service in production
  },

  /**
   * Log errors (always logged)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // TODO: Send to error tracking service (Sentry, etc.)
  },

  /**
   * Log success messages (only in development)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SUCCESS] ✅', ...args);
    }
  },
};

/**
 * Performance logger for measuring execution time
 */
export const perfLogger = {
  start: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  end: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
};

/**
 * Network request logger
 */
export const networkLogger = {
  request: (url: string, method: string, body?: any) => {
    if (isDevelopment) {
      console.log(`[NETWORK] ${method} ${url}`, body ? { body } : '');
    }
  },

  response: (url: string, status: number, data?: any) => {
    if (isDevelopment) {
      console.log(`[NETWORK] Response ${status} from ${url}`, data ? { data } : '');
    }
  },

  error: (url: string, error: any) => {
    console.error(`[NETWORK] Error from ${url}`, error);
    // TODO: Send to error tracking
  },
};
