/**
 * Error tracking configuration options
 */
export interface ErrorTrackingConfig {
	/** URL of mana-core-auth service */
	errorTrackingUrl: string;

	/** App identifier (e.g., 'chat', 'picture') */
	appId: string;

	/** Service name for identification */
	serviceName?: string;

	/** Default environment if not detected */
	environment?: 'development' | 'staging' | 'production';

	/** Log errors locally as well (default: true in dev) */
	enableLocalLogging?: boolean;

	/** Custom headers for requests */
	customHeaders?: Record<string, string>;

	/** Function to get auth token (optional) */
	getAuthToken?: () => Promise<string | null>;
}

/**
 * Error source types
 */
export type ErrorSourceType = 'backend' | 'frontend_web' | 'frontend_mobile';

/**
 * Error environments
 */
export type ErrorEnvironment = 'development' | 'staging' | 'production';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

/**
 * Error log payload sent to the API
 */
export interface ErrorLogPayload {
	// Required
	errorCode: string;
	errorType: string;
	message: string;

	// Optional
	stackTrace?: string;
	appId?: string;
	sourceType?: ErrorSourceType;
	serviceName?: string;
	userId?: string;
	sessionId?: string;
	requestUrl?: string;
	requestMethod?: string;
	requestHeaders?: Record<string, unknown>;
	requestBody?: Record<string, unknown>;
	responseStatusCode?: number;
	environment?: ErrorEnvironment;
	severity?: ErrorSeverity;
	context?: Record<string, unknown>;
	fingerprint?: string;
	browserInfo?: Record<string, unknown>;
	deviceInfo?: Record<string, unknown>;
	userAgent?: string;
	occurredAt?: string;
}

/**
 * Response from creating a single error log
 */
export interface CreateErrorLogResponse {
	success: boolean;
	id?: string;
	error?: string;
}

/**
 * Response from creating batch error logs
 */
export interface BatchErrorLogResponse {
	success: boolean;
	total: number;
	succeeded: number;
	failed: number;
}

/**
 * Manual error report options
 */
export interface ReportErrorOptions {
	errorCode: string;
	errorType: string;
	message: string;
	severity?: ErrorSeverity;
	context?: Record<string, unknown>;
	stackTrace?: string;
}

/**
 * Context for error capture in frontends
 */
export interface ErrorContext {
	component?: string;
	action?: string;
	[key: string]: unknown;
}
