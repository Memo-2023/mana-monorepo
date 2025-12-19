import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import type {
	ErrorTrackingConfig,
	ErrorLogPayload,
	ReportErrorOptions,
	CreateErrorLogResponse,
} from '../types';

export const ERROR_TRACKING_CONFIG = 'ERROR_TRACKING_CONFIG';

@Injectable()
export class ErrorTrackingService {
	private readonly logger = new Logger(ErrorTrackingService.name);
	private readonly config: ErrorTrackingConfig;

	constructor(
		@Inject(ERROR_TRACKING_CONFIG)
		@Optional()
		config?: ErrorTrackingConfig
	) {
		this.config = config || {
			errorTrackingUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
			appId: 'unknown',
		};
	}

	/**
	 * Report an error to the error tracking service
	 */
	async reportError(options: ReportErrorOptions): Promise<CreateErrorLogResponse> {
		const payload: ErrorLogPayload = {
			errorCode: options.errorCode,
			errorType: options.errorType,
			message: options.message,
			severity: options.severity || 'error',
			context: options.context,
			stackTrace: options.stackTrace,
			appId: this.config.appId,
			serviceName: this.config.serviceName,
			sourceType: 'backend',
			environment: this.config.environment || this.detectEnvironment(),
			occurredAt: new Date().toISOString(),
		};

		return this.sendErrorLog(payload);
	}

	/**
	 * Report an exception (Error object) to the error tracking service
	 */
	async reportException(
		error: Error,
		context?: Record<string, unknown>
	): Promise<CreateErrorLogResponse> {
		const payload: ErrorLogPayload = {
			errorCode: this.extractErrorCode(error),
			errorType: error.constructor.name,
			message: error.message,
			stackTrace: error.stack,
			severity: 'error',
			context,
			appId: this.config.appId,
			serviceName: this.config.serviceName,
			sourceType: 'backend',
			environment: this.config.environment || this.detectEnvironment(),
			occurredAt: new Date().toISOString(),
		};

		return this.sendErrorLog(payload);
	}

	/**
	 * Report an HTTP exception with request details
	 */
	async reportHttpException(
		error: Error,
		request: {
			url?: string;
			method?: string;
			headers?: Record<string, unknown>;
			body?: Record<string, unknown>;
			user?: { userId?: string; sessionId?: string };
		},
		statusCode?: number
	): Promise<CreateErrorLogResponse> {
		const payload: ErrorLogPayload = {
			errorCode: this.extractErrorCode(error),
			errorType: error.constructor.name,
			message: error.message,
			stackTrace: error.stack,
			severity: this.getSeverityFromStatusCode(statusCode),
			appId: this.config.appId,
			serviceName: this.config.serviceName,
			sourceType: 'backend',
			environment: this.config.environment || this.detectEnvironment(),
			requestUrl: request.url,
			requestMethod: request.method,
			requestHeaders: request.headers,
			requestBody: request.body,
			responseStatusCode: statusCode,
			userId: request.user?.userId,
			sessionId: request.user?.sessionId,
			occurredAt: new Date().toISOString(),
		};

		return this.sendErrorLog(payload);
	}

	/**
	 * Send error log to the tracking endpoint
	 */
	private async sendErrorLog(payload: ErrorLogPayload): Promise<CreateErrorLogResponse> {
		// Log locally if enabled
		if (this.config.enableLocalLogging !== false) {
			this.logger.error(`[${payload.errorCode}] ${payload.message}`, payload.stackTrace);
		}

		// Skip sending to remote in development by default
		if (this.detectEnvironment() === 'development' && !this.config.errorTrackingUrl) {
			return { success: true, id: 'local-only' };
		}

		try {
			const url = `${this.config.errorTrackingUrl}/api/v1/errors`;
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				'X-App-Id': this.config.appId,
				...this.config.customHeaders,
			};

			// Add auth token if available
			if (this.config.getAuthToken) {
				const token = await this.config.getAuthToken();
				if (token) {
					headers['Authorization'] = `Bearer ${token}`;
				}
			}

			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				this.logger.warn(`Failed to send error log: HTTP ${response.status}`);
				return { success: false, error: `HTTP ${response.status}` };
			}

			const result = (await response.json()) as CreateErrorLogResponse;
			return result;
		} catch (err) {
			this.logger.warn('Failed to send error log to tracking service', err);
			return { success: false, error: 'Network error' };
		}
	}

	/**
	 * Detect current environment
	 */
	private detectEnvironment(): 'development' | 'staging' | 'production' {
		const nodeEnv = process.env.NODE_ENV;
		if (nodeEnv === 'production') return 'production';
		if (nodeEnv === 'staging') return 'staging';
		return 'development';
	}

	/**
	 * Extract error code from error object
	 */
	private extractErrorCode(error: Error): string {
		// Check for common NestJS exception properties
		const anyError = error as unknown as Record<string, unknown>;
		if (anyError.code && typeof anyError.code === 'string') {
			return anyError.code;
		}
		if (anyError.name && typeof anyError.name === 'string') {
			return anyError.name;
		}
		return 'UNKNOWN_ERROR';
	}

	/**
	 * Get severity level from HTTP status code
	 */
	private getSeverityFromStatusCode(
		statusCode?: number
	): 'debug' | 'info' | 'warning' | 'error' | 'critical' {
		if (!statusCode) return 'error';
		if (statusCode >= 500) return 'critical';
		if (statusCode >= 400) return 'warning';
		return 'info';
	}
}
