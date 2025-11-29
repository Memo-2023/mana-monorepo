/**
 * Standardized credit error types for the frontend
 * These match the backend error response structure
 */

/**
 * Credit error codes
 */
export type CreditErrorCode =
	| 'INSUFFICIENT_CREDITS'
	| 'CREDIT_VALIDATION_FAILED'
	| 'CREDIT_SYSTEM_ERROR';

/**
 * Credit type
 */
export type CreditType = 'user' | 'space';

/**
 * Detailed credit error information
 */
export interface CreditErrorDetails {
	requiredCredits: number;
	availableCredits: number;
	creditType: CreditType;
	operation?: string;
	operationCost?: number;
	spaceId?: string;
	suggestions?: string[];
}

/**
 * Credit error object structure
 */
export interface CreditError {
	code: CreditErrorCode;
	message: string;
	details: CreditErrorDetails;
}

/**
 * Standardized credit error response from the API
 */
export interface CreditErrorResponse {
	error: CreditError;
	statusCode: number;
	timestamp: string;
	path?: string;
}

/**
 * Type guard to check if a response is a credit error
 */
export function isCreditErrorResponse(response: any): response is CreditErrorResponse {
	return (
		response &&
		typeof response === 'object' &&
		'error' in response &&
		typeof response.error === 'object' &&
		'code' in response.error &&
		['INSUFFICIENT_CREDITS', 'CREDIT_VALIDATION_FAILED', 'CREDIT_SYSTEM_ERROR'].includes(
			response.error.code
		)
	);
}

/**
 * Type guard to check if an error is specifically an insufficient credits error
 */
export function isInsufficientCreditsError(response: any): boolean {
	return isCreditErrorResponse(response) && response.error.code === 'INSUFFICIENT_CREDITS';
}

/**
 * Type guard to check if an error is a credit validation error
 */
export function isCreditValidationError(response: any): boolean {
	return isCreditErrorResponse(response) && response.error.code === 'CREDIT_VALIDATION_FAILED';
}

/**
 * Type guard to check if an error is a credit system error
 */
export function isCreditSystemError(response: any): boolean {
	return isCreditErrorResponse(response) && response.error.code === 'CREDIT_SYSTEM_ERROR';
}

/**
 * Extract credit error details from an error response
 */
export function extractCreditErrorDetails(error: any): CreditErrorDetails | null {
	if (isCreditErrorResponse(error)) {
		return error.error.details;
	}

	// Check if the error is nested in a response object
	if (error?.response?.data && isCreditErrorResponse(error.response.data)) {
		return error.response.data.error.details;
	}

	return null;
}

/**
 * Get a user-friendly message for a credit error
 */
export function getCreditErrorMessage(error: any): string {
	if (isCreditErrorResponse(error)) {
		return error.error.message;
	}

	// Check if the error is nested in a response object
	if (error?.response?.data && isCreditErrorResponse(error.response.data)) {
		return error.response.data.error.message;
	}

	// Fallback messages
	if (error?.message?.toLowerCase().includes('insufficient')) {
		return 'You do not have enough credits for this operation.';
	}

	return 'An error occurred while processing your credits. Please try again.';
}

/**
 * Format credit amount for display
 */
export function formatCredits(credits: number): string {
	return credits.toLocaleString();
}

/**
 * Create a credit error response object (for testing or manual error creation)
 */
export function createCreditErrorResponse(
	code: CreditErrorCode,
	requiredCredits: number,
	availableCredits: number,
	options?: {
		creditType?: CreditType;
		operation?: string;
		spaceId?: string;
		message?: string;
		suggestions?: string[];
		path?: string;
	}
): CreditErrorResponse {
	const creditType = options?.creditType || 'user';
	const defaultMessage =
		code === 'INSUFFICIENT_CREDITS'
			? `Insufficient ${creditType} credits. You need ${requiredCredits} credits but only have ${availableCredits}.`
			: code === 'CREDIT_VALIDATION_FAILED'
				? 'Credit validation failed'
				: 'An error occurred while processing credits';

	return {
		error: {
			code,
			message: options?.message || defaultMessage,
			details: {
				requiredCredits,
				availableCredits,
				creditType,
				operation: options?.operation,
				operationCost: requiredCredits,
				spaceId: options?.spaceId,
				suggestions: options?.suggestions || [
					'Purchase more credits from the subscription page',
					'Check if you have credits in a shared space',
					'Contact support if you believe this is an error',
				],
			},
		},
		statusCode:
			code === 'INSUFFICIENT_CREDITS' ? 402 : code === 'CREDIT_VALIDATION_FAILED' ? 400 : 500,
		timestamp: new Date().toISOString(),
		path: options?.path,
	};
}
