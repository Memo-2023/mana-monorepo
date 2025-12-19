import type {
	ErrorTrackingConfig,
	ErrorLogPayload,
	ErrorContext,
	CreateErrorLogResponse,
	ErrorSourceType,
} from '../types';

/**
 * Frontend error tracker client
 */
export class ErrorTracker {
	private config: ErrorTrackingConfig;
	private queue: ErrorLogPayload[] = [];
	private isFlushing = false;

	constructor(config: ErrorTrackingConfig) {
		this.config = config;
	}

	/**
	 * Capture an error and send it to the tracking service
	 */
	async captureError(
		error: Error | unknown,
		context?: ErrorContext
	): Promise<CreateErrorLogResponse> {
		const payload = this.buildPayload(error, context);

		// Log locally if enabled
		if (this.config.enableLocalLogging !== false) {
			console.error(`[${payload.errorCode}] ${payload.message}`, error);
		}

		return this.sendError(payload);
	}

	/**
	 * Capture a message as an error
	 */
	async captureMessage(
		message: string,
		severity: 'debug' | 'info' | 'warning' | 'error' | 'critical' = 'info',
		context?: ErrorContext
	): Promise<CreateErrorLogResponse> {
		const payload: ErrorLogPayload = {
			errorCode: 'MESSAGE',
			errorType: 'CapturedMessage',
			message,
			severity,
			context,
			appId: this.config.appId,
			serviceName: this.config.serviceName,
			sourceType: this.detectSourceType(),
			environment: this.config.environment || this.detectEnvironment(),
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
			browserInfo: this.getBrowserInfo(),
			occurredAt: new Date().toISOString(),
		};

		return this.sendError(payload);
	}

	/**
	 * Queue an error for batch sending (useful for offline scenarios)
	 */
	queueError(error: Error | unknown, context?: ErrorContext): void {
		const payload = this.buildPayload(error, context);
		this.queue.push(payload);
	}

	/**
	 * Flush queued errors to the tracking service
	 */
	async flushQueue(): Promise<void> {
		if (this.isFlushing || this.queue.length === 0) return;

		this.isFlushing = true;
		const errors = [...this.queue];
		this.queue = [];

		try {
			await this.sendBatch(errors);
		} catch {
			// Re-queue failed errors
			this.queue.unshift(...errors);
		} finally {
			this.isFlushing = false;
		}
	}

	/**
	 * Build error payload from error object
	 */
	private buildPayload(error: Error | unknown, context?: ErrorContext): ErrorLogPayload {
		const err = error instanceof Error ? error : new Error(String(error));

		return {
			errorCode: this.extractErrorCode(err),
			errorType: err.constructor.name,
			message: err.message,
			stackTrace: err.stack,
			severity: 'error',
			context,
			appId: this.config.appId,
			serviceName: this.config.serviceName,
			sourceType: this.detectSourceType(),
			environment: this.config.environment || this.detectEnvironment(),
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
			browserInfo: this.getBrowserInfo(),
			occurredAt: new Date().toISOString(),
		};
	}

	/**
	 * Send a single error to the tracking service
	 */
	private async sendError(payload: ErrorLogPayload): Promise<CreateErrorLogResponse> {
		try {
			const url = `${this.config.errorTrackingUrl}/api/v1/errors`;
			const headers = await this.buildHeaders();

			const response = await fetch(url, {
				method: 'POST',
				headers,
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				return { success: false, error: `HTTP ${response.status}` };
			}

			return (await response.json()) as CreateErrorLogResponse;
		} catch (err) {
			console.warn('Failed to send error to tracking service', err);
			return { success: false, error: 'Network error' };
		}
	}

	/**
	 * Send batch errors to the tracking service
	 */
	private async sendBatch(errors: ErrorLogPayload[]): Promise<void> {
		const url = `${this.config.errorTrackingUrl}/api/v1/errors/batch`;
		const headers = await this.buildHeaders();

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify({ errors }),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
	}

	/**
	 * Build request headers
	 */
	private async buildHeaders(): Promise<Record<string, string>> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'X-App-Id': this.config.appId,
			...this.config.customHeaders,
		};

		if (this.config.getAuthToken) {
			const token = await this.config.getAuthToken();
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
		}

		return headers;
	}

	/**
	 * Detect source type based on environment
	 */
	private detectSourceType(): ErrorSourceType {
		if (typeof window === 'undefined') {
			return 'backend'; // SSR or Node.js
		}
		// Check for React Native
		if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
			return 'frontend_mobile';
		}
		return 'frontend_web';
	}

	/**
	 * Detect current environment
	 */
	private detectEnvironment(): 'development' | 'staging' | 'production' {
		if (typeof process !== 'undefined' && process.env) {
			const nodeEnv = process.env.NODE_ENV;
			if (nodeEnv === 'production') return 'production';
			if (nodeEnv === 'staging') return 'staging';
		}
		// Check for common dev indicators
		if (typeof window !== 'undefined') {
			const hostname = window.location?.hostname;
			if (hostname === 'localhost' || hostname === '127.0.0.1') {
				return 'development';
			}
			if (hostname?.includes('staging') || hostname?.includes('stage')) {
				return 'staging';
			}
		}
		return 'production';
	}

	/**
	 * Extract error code from error object
	 */
	private extractErrorCode(error: Error): string {
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
	 * Get browser information
	 */
	private getBrowserInfo(): Record<string, unknown> | undefined {
		if (typeof window === 'undefined' || typeof navigator === 'undefined') {
			return undefined;
		}

		return {
			userAgent: navigator.userAgent,
			language: navigator.language,
			platform: navigator.platform,
			cookieEnabled: navigator.cookieEnabled,
			onLine: navigator.onLine,
			url: window.location?.href,
			referrer: document?.referrer,
			screenWidth: window.screen?.width,
			screenHeight: window.screen?.height,
			viewportWidth: window.innerWidth,
			viewportHeight: window.innerHeight,
		};
	}
}

/**
 * Create an error tracker instance
 */
export function createErrorTracker(config: ErrorTrackingConfig): ErrorTracker {
	return new ErrorTracker(config);
}
