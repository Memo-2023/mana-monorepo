import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Custom format for development (readable)
const devFormat = printf(({ level, message, timestamp, context, ...meta }) => {
	const ctx = context ? `[${context}]` : '';
	const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
	return `${timestamp} ${level} ${ctx} ${message}${metaStr}`;
});

// Create winston logger instance
function createLogger(): winston.Logger {
	const isProduction = process.env.NODE_ENV === 'production';

	return winston.createLogger({
		level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
		format: isProduction
			? combine(timestamp(), json())
			: combine(timestamp({ format: 'HH:mm:ss' }), colorize(), devFormat),
		transports: [new winston.transports.Console()],
		// Don't exit on error
		exitOnError: false,
	});
}

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
	private logger: winston.Logger;
	private context?: string;

	constructor() {
		this.logger = createLogger();
	}

	setContext(context: string): this {
		this.context = context;
		return this;
	}

	log(message: string, ...optionalParams: unknown[]): void {
		this.logger.info(message, this.formatMeta(optionalParams));
	}

	info(message: string, meta?: Record<string, unknown>): void {
		this.logger.info(message, { context: this.context, ...meta });
	}

	error(message: string, trace?: string, ...optionalParams: unknown[]): void {
		this.logger.error(message, {
			context: this.context,
			trace,
			...this.formatMeta(optionalParams),
		});
	}

	warn(message: string, ...optionalParams: unknown[]): void {
		this.logger.warn(message, this.formatMeta(optionalParams));
	}

	debug(message: string, ...optionalParams: unknown[]): void {
		this.logger.debug(message, this.formatMeta(optionalParams));
	}

	verbose(message: string, ...optionalParams: unknown[]): void {
		this.logger.verbose(message, this.formatMeta(optionalParams));
	}

	private formatMeta(optionalParams: unknown[]): Record<string, unknown> {
		const meta: Record<string, unknown> = { context: this.context };

		if (optionalParams.length === 1 && typeof optionalParams[0] === 'string') {
			// NestJS passes context as last param
			meta.context = optionalParams[0];
		} else if (optionalParams.length > 0) {
			meta.params = optionalParams;
		}

		return meta;
	}
}

// Singleton instance for use outside DI (main.ts, scripts)
let globalLogger: LoggerService | null = null;

export function getLogger(context?: string): LoggerService {
	if (!globalLogger) {
		globalLogger = new LoggerService();
	}
	if (context) {
		return new LoggerService().setContext(context);
	}
	return globalLogger;
}
