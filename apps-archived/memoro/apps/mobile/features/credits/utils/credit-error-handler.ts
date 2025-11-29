import {
	CreditErrorResponse,
	isCreditErrorResponse,
	isInsufficientCreditsError,
	extractCreditErrorDetails,
	getCreditErrorMessage,
} from '~/features/core/types/credit-error.types';

/**
 * Credit error handler utility
 * Provides centralized handling of credit-related errors
 */

export interface CreditErrorHandlerOptions {
	onInsufficientCredits?: (details: CreditErrorResponse) => void;
	onValidationError?: (details: CreditErrorResponse) => void;
	onSystemError?: (details: CreditErrorResponse) => void;
	onGenericError?: (error: any) => void;
	showInsufficientCreditsModal?: boolean;
	logErrors?: boolean;
}

/**
 * Handle credit errors with appropriate actions
 */
export class CreditErrorHandler {
	private options: CreditErrorHandlerOptions;

	constructor(options: CreditErrorHandlerOptions = {}) {
		this.options = {
			showInsufficientCreditsModal: true,
			logErrors: true,
			...options,
		};
	}

	/**
	 * Process an error and handle it appropriately
	 */
	handle(error: any): boolean {
		// Log error if enabled
		if (this.options.logErrors) {
			console.error('[CreditErrorHandler] Processing error:', error);
		}

		// Extract the actual error response
		const errorResponse = this.extractErrorResponse(error);

		// Check if it's a credit error
		if (isCreditErrorResponse(errorResponse)) {
			switch (errorResponse.error.code) {
				case 'INSUFFICIENT_CREDITS':
					this.handleInsufficientCredits(errorResponse);
					return true;

				case 'CREDIT_VALIDATION_FAILED':
					this.handleValidationError(errorResponse);
					return true;

				case 'CREDIT_SYSTEM_ERROR':
					this.handleSystemError(errorResponse);
					return true;
			}
		}

		// Not a credit error
		if (this.options.onGenericError) {
			this.options.onGenericError(error);
		}
		return false;
	}

	/**
	 * Extract error response from various error formats
	 */
	private extractErrorResponse(error: any): any {
		// Direct error response
		if (isCreditErrorResponse(error)) {
			return error;
		}

		// Axios error format
		if (error?.response?.data) {
			return error.response.data;
		}

		// Fetch error with JSON body
		if (error?.body) {
			return error.body;
		}

		return error;
	}

	/**
	 * Handle insufficient credits error
	 */
	private handleInsufficientCredits(errorResponse: CreditErrorResponse) {
		if (this.options.logErrors) {
			console.log('[CreditErrorHandler] Insufficient credits:', {
				required: errorResponse.error.details.requiredCredits,
				available: errorResponse.error.details.availableCredits,
				operation: errorResponse.error.details.operation,
			});
		}

		if (this.options.onInsufficientCredits) {
			this.options.onInsufficientCredits(errorResponse);
		}
	}

	/**
	 * Handle validation error
	 */
	private handleValidationError(errorResponse: CreditErrorResponse) {
		if (this.options.logErrors) {
			console.warn('[CreditErrorHandler] Credit validation failed:', errorResponse.error.message);
		}

		if (this.options.onValidationError) {
			this.options.onValidationError(errorResponse);
		}
	}

	/**
	 * Handle system error
	 */
	private handleSystemError(errorResponse: CreditErrorResponse) {
		if (this.options.logErrors) {
			console.error('[CreditErrorHandler] Credit system error:', errorResponse.error.message);
		}

		if (this.options.onSystemError) {
			this.options.onSystemError(errorResponse);
		}
	}

	/**
	 * Check if an error is a credit error
	 */
	static isCreditError(error: any): boolean {
		const errorResponse = error?.response?.data || error;
		return isCreditErrorResponse(errorResponse);
	}

	/**
	 * Check if an error is specifically an insufficient credits error
	 */
	static isInsufficientCredits(error: any): boolean {
		const errorResponse = error?.response?.data || error;
		return isInsufficientCreditsError(errorResponse);
	}

	/**
	 * Get user-friendly message from error
	 */
	static getMessage(error: any): string {
		return getCreditErrorMessage(error);
	}

	/**
	 * Extract credit details from error
	 */
	static getDetails(error: any) {
		return extractCreditErrorDetails(error);
	}
}

/**
 * Create a default credit error handler instance
 */
export const defaultCreditErrorHandler = new CreditErrorHandler();

/**
 * Utility function to check and handle credit errors
 * Returns true if the error was handled
 */
export function handleCreditError(error: any, options?: CreditErrorHandlerOptions): boolean {
	const handler = new CreditErrorHandler(options);
	return handler.handle(error);
}

/**
 * React hook for credit error handling
 */
export function useCreditErrorHandler(options?: CreditErrorHandlerOptions) {
	const handler = new CreditErrorHandler(options);

	return {
		handleError: (error: any) => handler.handle(error),
		isCreditError: CreditErrorHandler.isCreditError,
		isInsufficientCredits: CreditErrorHandler.isInsufficientCredits,
		getMessage: CreditErrorHandler.getMessage,
		getDetails: CreditErrorHandler.getDetails,
	};
}
