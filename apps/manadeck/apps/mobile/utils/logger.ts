/**
 * Simple logger utility for consistent logging across the app
 * Can be extended to integrate with crash reporting services
 */

const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

export const debug = (...args: any[]): void => {
  if (isDevelopment) {
    console.debug('[DEBUG]', ...args);
  }
};

export const info = (...args: any[]): void => {
  if (isDevelopment) {
    console.info('[INFO]', ...args);
  }
};

export const warn = (...args: any[]): void => {
  console.warn('[WARN]', ...args);
};

export const error = (...args: any[]): void => {
  console.error('[ERROR]', ...args);
  // TODO: Send to crash reporting service in production
};

export const log = (...args: any[]): void => {
  if (isDevelopment) {
    console.log('[LOG]', ...args);
  }
};
