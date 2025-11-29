/**
 * Centralized logging utility that only shows debug logs in development
 */

const isDevelopment = __DEV__;

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

class Logger {
	private level: LogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

	debug(...args: any[]) {
		if (this.level <= LogLevel.DEBUG) {
			console.log('[DEBUG]', ...args);
		}
	}

	info(...args: any[]) {
		if (this.level <= LogLevel.INFO) {
			console.log(...args);
		}
	}

	warn(...args: any[]) {
		if (this.level <= LogLevel.WARN) {
			console.warn(...args);
		}
	}

	error(...args: any[]) {
		if (this.level <= LogLevel.ERROR) {
			console.error(...args);
		}
	}

	setLevel(level: LogLevel) {
		this.level = level;
	}
}

export const logger = new Logger();

// Convenience exports
export const debug = (...args: any[]) => logger.debug(...args);
export const info = (...args: any[]) => logger.info(...args);
export const warn = (...args: any[]) => logger.warn(...args);
export const error = (...args: any[]) => logger.error(...args);
