/**
 * Shared Logger Utilities for ManaCore Apps
 * Provides consistent logging across mobile and web applications.
 */

// Check if we're in development mode
// Works in both React Native (__DEV__) and Node.js environments
declare const __DEV__: boolean | undefined;
const isDevelopment =
	typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

/**
 * Main logger object with standard log levels.
 * Debug and info only log in development mode.
 * Warn and error always log.
 */
export const logger = {
	/** Log debug information (only in development) */
	debug: (...args: unknown[]): void => {
		if (isDevelopment) {
			console.debug('[DEBUG]', ...args);
		}
	},

	/** Log general information (only in development) */
	info: (...args: unknown[]): void => {
		if (isDevelopment) {
			console.info('[INFO]', ...args);
		}
	},

	/** Log warnings (always logged) */
	warn: (...args: unknown[]): void => {
		console.warn('[WARN]', ...args);
	},

	/** Log errors (always logged) */
	error: (...args: unknown[]): void => {
		console.error('[ERROR]', ...args);
	},

	/** Log success messages (only in development) */
	success: (...args: unknown[]): void => {
		if (isDevelopment) {
			console.log('[SUCCESS]', ...args);
		}
	},

	/** General log (only in development) */
	log: (...args: unknown[]): void => {
		if (isDevelopment) {
			console.log('[LOG]', ...args);
		}
	},
};

/**
 * Performance logger for measuring execution time.
 * Only logs in development mode.
 */
export const perfLogger = {
	/** Start a performance timer with a label */
	start: (label: string): void => {
		if (isDevelopment) {
			console.time(label);
		}
	},

	/** End a performance timer and log the duration */
	end: (label: string): void => {
		if (isDevelopment) {
			console.timeEnd(label);
		}
	},
};

/**
 * Network request logger for API debugging.
 * Request and response only log in development.
 * Errors always log.
 */
export const networkLogger = {
	/** Log an outgoing network request */
	request: (url: string, method: string, body?: unknown): void => {
		if (isDevelopment) {
			console.log(`[NETWORK] ${method} ${url}`, body ? { body } : '');
		}
	},

	/** Log a network response */
	response: (url: string, status: number, data?: unknown): void => {
		if (isDevelopment) {
			console.log(`[NETWORK] Response ${status} from ${url}`, data ? { data } : '');
		}
	},

	/** Log a network error (always logged) */
	error: (url: string, error: unknown): void => {
		console.error(`[NETWORK] Error from ${url}`, error);
	},
};

// Individual function exports for backwards compatibility with cards pattern
export const debug = logger.debug;
export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;
export const log = logger.log;
