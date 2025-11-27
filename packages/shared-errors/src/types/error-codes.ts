/**
 * Standardized error codes across all backends.
 * Follows pattern: CATEGORY_SPECIFIC_ERROR
 */
export enum ErrorCode {
	// Validation Errors (400)
	VALIDATION_FAILED = 'VALIDATION_FAILED',
	INVALID_INPUT = 'INVALID_INPUT',
	MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
	INVALID_FORMAT = 'INVALID_FORMAT',

	// Authentication Errors (401)
	AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
	INVALID_TOKEN = 'INVALID_TOKEN',
	TOKEN_EXPIRED = 'TOKEN_EXPIRED',

	// Authorization Errors (403)
	PERMISSION_DENIED = 'PERMISSION_DENIED',
	RESOURCE_NOT_OWNED = 'RESOURCE_NOT_OWNED',

	// Not Found Errors (404)
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
	USER_NOT_FOUND = 'USER_NOT_FOUND',

	// Payment/Credit Errors (402)
	INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
	PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',

	// Conflict Errors (409)
	CONFLICT = 'CONFLICT',
	DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

	// Rate Limiting (429)
	RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
	TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

	// Service Errors (500)
	INTERNAL_ERROR = 'INTERNAL_ERROR',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
	GENERATION_FAILED = 'GENERATION_FAILED',
	EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

	// Network Errors (502/503/504)
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT = 'TIMEOUT',
	CONNECTION_REFUSED = 'CONNECTION_REFUSED',

	// Database Errors
	DATABASE_ERROR = 'DATABASE_ERROR',
	CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

	// Unknown
	UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Maps error codes to default HTTP status codes.
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<ErrorCode, number> = {
	// Validation (400)
	[ErrorCode.VALIDATION_FAILED]: 400,
	[ErrorCode.INVALID_INPUT]: 400,
	[ErrorCode.MISSING_REQUIRED_FIELD]: 400,
	[ErrorCode.INVALID_FORMAT]: 400,

	// Authentication (401)
	[ErrorCode.AUTHENTICATION_REQUIRED]: 401,
	[ErrorCode.INVALID_TOKEN]: 401,
	[ErrorCode.TOKEN_EXPIRED]: 401,

	// Authorization (403)
	[ErrorCode.PERMISSION_DENIED]: 403,
	[ErrorCode.RESOURCE_NOT_OWNED]: 403,

	// Not Found (404)
	[ErrorCode.RESOURCE_NOT_FOUND]: 404,
	[ErrorCode.USER_NOT_FOUND]: 404,

	// Payment (402)
	[ErrorCode.INSUFFICIENT_CREDITS]: 402,
	[ErrorCode.PAYMENT_REQUIRED]: 402,

	// Conflict (409)
	[ErrorCode.CONFLICT]: 409,
	[ErrorCode.DUPLICATE_ENTRY]: 409,

	// Rate Limit (429)
	[ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
	[ErrorCode.TOO_MANY_REQUESTS]: 429,

	// Service Errors (500)
	[ErrorCode.INTERNAL_ERROR]: 500,
	[ErrorCode.SERVICE_UNAVAILABLE]: 503,
	[ErrorCode.GENERATION_FAILED]: 500,
	[ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,

	// Network Errors
	[ErrorCode.NETWORK_ERROR]: 502,
	[ErrorCode.TIMEOUT]: 504,
	[ErrorCode.CONNECTION_REFUSED]: 503,

	// Database Errors
	[ErrorCode.DATABASE_ERROR]: 500,
	[ErrorCode.CONSTRAINT_VIOLATION]: 409,

	// Unknown
	[ErrorCode.UNKNOWN_ERROR]: 500,
};

/**
 * Maps error codes to default retryable status.
 */
export const ERROR_CODE_RETRYABLE: Record<ErrorCode, boolean> = {
	// Validation - not retryable (user needs to fix input)
	[ErrorCode.VALIDATION_FAILED]: false,
	[ErrorCode.INVALID_INPUT]: false,
	[ErrorCode.MISSING_REQUIRED_FIELD]: false,
	[ErrorCode.INVALID_FORMAT]: false,

	// Authentication - not retryable (need new credentials)
	[ErrorCode.AUTHENTICATION_REQUIRED]: false,
	[ErrorCode.INVALID_TOKEN]: false,
	[ErrorCode.TOKEN_EXPIRED]: false,

	// Authorization - not retryable (permission issue)
	[ErrorCode.PERMISSION_DENIED]: false,
	[ErrorCode.RESOURCE_NOT_OWNED]: false,

	// Not Found - not retryable (resource doesn't exist)
	[ErrorCode.RESOURCE_NOT_FOUND]: false,
	[ErrorCode.USER_NOT_FOUND]: false,

	// Payment - not retryable (need more credits)
	[ErrorCode.INSUFFICIENT_CREDITS]: false,
	[ErrorCode.PAYMENT_REQUIRED]: false,

	// Conflict - not retryable (data issue)
	[ErrorCode.CONFLICT]: false,
	[ErrorCode.DUPLICATE_ENTRY]: false,

	// Rate Limit - retryable (after waiting)
	[ErrorCode.RATE_LIMIT_EXCEEDED]: true,
	[ErrorCode.TOO_MANY_REQUESTS]: true,

	// Service Errors - retryable (transient issues)
	[ErrorCode.INTERNAL_ERROR]: true,
	[ErrorCode.SERVICE_UNAVAILABLE]: true,
	[ErrorCode.GENERATION_FAILED]: true,
	[ErrorCode.EXTERNAL_SERVICE_ERROR]: true,

	// Network Errors - retryable (transient issues)
	[ErrorCode.NETWORK_ERROR]: true,
	[ErrorCode.TIMEOUT]: true,
	[ErrorCode.CONNECTION_REFUSED]: true,

	// Database Errors - not retryable (except transient, but safer to say no)
	[ErrorCode.DATABASE_ERROR]: false,
	[ErrorCode.CONSTRAINT_VIOLATION]: false,

	// Unknown - retryable (might be transient)
	[ErrorCode.UNKNOWN_ERROR]: true,
};
