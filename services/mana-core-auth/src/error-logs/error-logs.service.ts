import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getDb } from '../db/connection';
import { errorLogs } from '../db/schema';
import type { CreateErrorLogDto } from './dto';
import * as crypto from 'crypto';

// Sensitive header keys to sanitize
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'api-key'];

// Sensitive body field keys to sanitize
const SENSITIVE_BODY_FIELDS = ['password', 'token', 'secret', 'apikey', 'api_key'];

@Injectable()
export class ErrorLogsService {
	private readonly logger = new Logger(ErrorLogsService.name);

	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Create a single error log entry
	 */
	async createErrorLog(
		dto: CreateErrorLogDto,
		appIdHeader?: string,
		userId?: string
	): Promise<{ success: boolean; id?: string; error?: string }> {
		try {
			const db = this.getDb();

			const appId = dto.appId || appIdHeader || 'unknown';
			const sanitizedHeaders = this.sanitizeHeaders(dto.requestHeaders);
			const sanitizedBody = this.sanitizeBody(dto.requestBody);
			const fingerprint = dto.fingerprint || this.generateFingerprint(dto, appId);
			const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();

			const [errorLog] = await db
				.insert(errorLogs)
				.values({
					errorCode: dto.errorCode,
					errorType: dto.errorType,
					message: dto.message,
					stackTrace: dto.stackTrace,
					appId,
					sourceType: dto.sourceType,
					serviceName: dto.serviceName,
					userId: dto.userId || userId,
					sessionId: dto.sessionId,
					requestUrl: dto.requestUrl,
					requestMethod: dto.requestMethod,
					requestHeaders: sanitizedHeaders,
					requestBody: sanitizedBody,
					responseStatusCode: dto.responseStatusCode,
					environment: dto.environment,
					severity: dto.severity || 'error',
					context: dto.context || {},
					fingerprint,
					userAgent: dto.userAgent,
					browserInfo: dto.browserInfo,
					deviceInfo: dto.deviceInfo,
					occurredAt,
				})
				.returning({ id: errorLogs.id });

			return { success: true, id: errorLog.id };
		} catch (error) {
			this.logger.error('Failed to create error log', error);
			return { success: false, error: 'Failed to create error log' };
		}
	}

	/**
	 * Create multiple error log entries in batch
	 */
	async createErrorLogsBatch(
		errors: CreateErrorLogDto[],
		appIdHeader?: string,
		userId?: string
	): Promise<{ success: boolean; total: number; succeeded: number; failed: number }> {
		let succeeded = 0;
		let failed = 0;

		for (const errorDto of errors) {
			const result = await this.createErrorLog(errorDto, appIdHeader, userId);
			if (result.success) {
				succeeded++;
			} else {
				failed++;
			}
		}

		return {
			success: failed === 0,
			total: errors.length,
			succeeded,
			failed,
		};
	}

	/**
	 * Sanitize headers to remove sensitive information
	 */
	private sanitizeHeaders(headers?: Record<string, unknown>): Record<string, unknown> | undefined {
		if (!headers) return undefined;

		const sanitized: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(headers)) {
			if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
				sanitized[key] = '[REDACTED]';
			} else {
				sanitized[key] = value;
			}
		}
		return sanitized;
	}

	/**
	 * Sanitize body to remove sensitive information
	 */
	private sanitizeBody(body?: Record<string, unknown>): Record<string, unknown> | undefined {
		if (!body) return undefined;

		const sanitized: Record<string, unknown> = {};
		for (const [key, value] of Object.entries(body)) {
			if (SENSITIVE_BODY_FIELDS.includes(key.toLowerCase())) {
				sanitized[key] = '[REDACTED]';
			} else if (typeof value === 'object' && value !== null) {
				sanitized[key] = this.sanitizeBody(value as Record<string, unknown>);
			} else {
				sanitized[key] = value;
			}
		}
		return sanitized;
	}

	/**
	 * Generate a fingerprint for error grouping/deduplication
	 */
	private generateFingerprint(dto: CreateErrorLogDto, appId: string): string {
		const parts = [
			dto.errorCode,
			dto.errorType,
			appId,
			dto.requestMethod || '',
			this.extractPathFromUrl(dto.requestUrl),
		];

		const hash = crypto.createHash('sha256').update(parts.join('|')).digest('hex');
		return hash.substring(0, 32);
	}

	/**
	 * Extract path from URL (without query parameters)
	 */
	private extractPathFromUrl(url?: string): string {
		if (!url) return '';
		try {
			const parsed = new URL(url, 'http://placeholder');
			return parsed.pathname;
		} catch {
			// If URL parsing fails, try to extract path manually
			const queryStart = url.indexOf('?');
			return queryStart > -1 ? url.substring(0, queryStart) : url;
		}
	}
}
