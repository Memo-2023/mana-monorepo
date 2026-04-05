/**
 * Shared Logger Utilities for Mana Apps
 *
 * Dual-mode logger:
 * - **Development / Browser**: Console output with colored prefixes (human-readable)
 * - **Production / Server**: JSON lines with timestamp, level, service, requestId (machine-readable)
 *
 * JSON mode is auto-detected in production Node.js/Bun environments.
 * Override with `LOGGER_FORMAT=json` or `LOGGER_FORMAT=console`.
 */

// ─── Environment detection ─────────────────────────────────

declare const __DEV__: boolean | undefined;
const isDevelopment =
	typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const isBrowser = typeof window !== 'undefined';

const useJson =
	process.env.LOGGER_FORMAT === 'json' ||
	(process.env.LOGGER_FORMAT !== 'console' && !isDevelopment && !isBrowser);

// ─── Request context (AsyncLocalStorage for correlation IDs) ─

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let _serviceName = 'unknown';
let _getRequestId: (() => string | undefined) | null = null;

/**
 * Configure the logger for a service. Call once at startup.
 *
 * @example
 * ```typescript
 * import { configureLogger } from '@mana/shared-logger';
 * configureLogger({ serviceName: 'todo-server' });
 * ```
 */
export function configureLogger(opts: {
	serviceName: string;
	getRequestId?: () => string | undefined;
}): void {
	_serviceName = opts.serviceName;
	if (opts.getRequestId) _getRequestId = opts.getRequestId;
}

// ─── JSON formatter ─────────────────────────────────────────

function jsonLog(level: LogLevel, args: unknown[]): void {
	const entry: Record<string, unknown> = {
		ts: new Date().toISOString(),
		level,
		service: _serviceName,
	};

	const requestId = _getRequestId?.();
	if (requestId) entry.requestId = requestId;

	// First string arg becomes `msg`, rest goes into `data`
	if (typeof args[0] === 'string') {
		entry.msg = args[0];
		if (args.length > 1) {
			entry.data = args.length === 2 ? args[1] : args.slice(1);
		}
	} else {
		entry.data = args.length === 1 ? args[0] : args;
	}

	// Serialize errors
	if (entry.data instanceof Error) {
		entry.data = { message: entry.data.message, stack: entry.data.stack };
	}

	const line = JSON.stringify(entry);
	if (level === 'error') process.stderr.write(line + '\n');
	else process.stdout.write(line + '\n');
}

// ─── Console formatter (original behavior) ──────────────────

function consoleLog(level: LogLevel, args: unknown[]): void {
	const prefix = `[${level.toUpperCase()}]`;
	switch (level) {
		case 'debug':
			console.debug(prefix, ...args);
			break;
		case 'info':
			console.info(prefix, ...args);
			break;
		case 'warn':
			console.warn(prefix, ...args);
			break;
		case 'error':
			console.error(prefix, ...args);
			break;
	}
}

function emit(level: LogLevel, args: unknown[]): void {
	if (useJson) jsonLog(level, args);
	else consoleLog(level, args);
}

// ─── Main logger ────────────────────────────────────────────

/**
 * Main logger object with standard log levels.
 * Debug and info only log in development mode (console) or always in JSON mode.
 * Warn and error always log.
 */
export const logger = {
	/** Log debug information (only in development, or always in JSON mode) */
	debug: (...args: unknown[]): void => {
		if (isDevelopment || useJson) emit('debug', args);
	},

	/** Log general information (only in development, or always in JSON mode) */
	info: (...args: unknown[]): void => {
		if (isDevelopment || useJson) emit('info', args);
	},

	/** Log warnings (always logged) */
	warn: (...args: unknown[]): void => {
		emit('warn', args);
	},

	/** Log errors (always logged) */
	error: (...args: unknown[]): void => {
		emit('error', args);
	},

	/** Log success messages (only in development) */
	success: (...args: unknown[]): void => {
		if (isDevelopment) {
			if (useJson) jsonLog('info', [{ success: true }, ...args]);
			else console.log('[SUCCESS]', ...args);
		}
	},

	/** General log (only in development, or always in JSON mode) */
	log: (...args: unknown[]): void => {
		if (isDevelopment || useJson) emit('info', args);
	},
};

// ─── Performance logger ─────────────────────────────────────

const perfTimers = new Map<string, number>();

/**
 * Performance logger for measuring execution time.
 */
export const perfLogger = {
	/** Start a performance timer with a label */
	start: (label: string): void => {
		if (useJson) {
			perfTimers.set(label, performance.now());
		} else if (isDevelopment) {
			console.time(label);
		}
	},

	/** End a performance timer and log the duration */
	end: (label: string): void => {
		if (useJson) {
			const start = perfTimers.get(label);
			if (start !== undefined) {
				const durationMs = Math.round(performance.now() - start);
				perfTimers.delete(label);
				jsonLog('info', ['perf', { label, durationMs }]);
			}
		} else if (isDevelopment) {
			console.timeEnd(label);
		}
	},
};

// ─── Network logger ─────────────────────────────────────────

/**
 * Network request logger for API debugging.
 * Request and response only log in development or JSON mode.
 * Errors always log.
 */
export const networkLogger = {
	/** Log an outgoing network request */
	request: (url: string, method: string, body?: unknown): void => {
		if (isDevelopment || useJson) {
			emit('info', ['network_request', { method, url, ...(body !== undefined && { body }) }]);
		}
	},

	/** Log a network response */
	response: (url: string, status: number, data?: unknown): void => {
		if (isDevelopment || useJson) {
			emit('info', ['network_response', { url, status, ...(data !== undefined && { data }) }]);
		}
	},

	/** Log a network error (always logged) */
	error: (url: string, error: unknown): void => {
		emit('error', [
			'network_error',
			{ url, error: error instanceof Error ? error.message : String(error) },
		]);
	},
};

// ─── Backwards-compatible individual exports ────────────────

export const debug = logger.debug;
export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;
export const log = logger.log;
