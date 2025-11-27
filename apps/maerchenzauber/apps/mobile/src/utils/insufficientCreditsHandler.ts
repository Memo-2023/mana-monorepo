/**
 * Handles insufficient credits errors with the standardized format from Mana Core
 */

interface InsufficientCreditsError {
	statusCode: number;
	error?: string;
	message: string;
	details?: {
		requiredCredits: number;
		availableCredits: number;
		creditType: 'user' | 'space';
		operation: string;
	};
}

/**
 * Check if an error response is an insufficient credits error
 */
export function isInsufficientCreditsError(error: any): error is InsufficientCreditsError {
	return (
		error?.statusCode === 402 ||
		error?.error === 'InsufficientCredits' ||
		error?.error === 'insufficient_credits' ||
		(error?.message &&
			(error.message.includes('Insufficient credits') ||
				error.message.includes('insufficient credits')))
	);
}

/**
 * Parse error response to extract credit information
 */
export function parseInsufficientCreditsError(error: any): {
	requiredCredits?: number;
	availableCredits?: number;
	creditType?: 'user' | 'space';
	operation?: string;
} {
	// Handle standardized format from Mana Core
	if (error?.details) {
		return {
			requiredCredits: error.details.requiredCredits,
			availableCredits: error.details.availableCredits,
			creditType: error.details.creditType,
			operation: error.details.operation,
		};
	}

	// Handle legacy format with message parsing
	const message = error?.message || '';
	if (message) {
		const requiredMatch = message.match(/Required:\s*(\d+)/i);
		const availableMatch = message.match(/Available:\s*(\d+)/i);

		return {
			requiredCredits: requiredMatch ? parseInt(requiredMatch[1]) : undefined,
			availableCredits: availableMatch ? parseInt(availableMatch[1]) : undefined,
			creditType: 'user',
			operation: error?.operation || 'unknown',
		};
	}

	return {};
}

/**
 * Format insufficient credits message for display
 */
export function formatInsufficientCreditsMessage(
	errorData: ReturnType<typeof parseInsufficientCreditsError>
): string {
	if (errorData.requiredCredits && errorData.availableCredits !== undefined) {
		return `Du benötigst ${errorData.requiredCredits} Credits, hast aber nur ${errorData.availableCredits} verfügbar.`;
	}

	return 'Du hast nicht genügend Credits für diese Operation.';
}
