import { HttpException, HttpStatus } from '@nestjs/common';

export interface InsufficientCreditsErrorData {
	requiredCredits: number;
	availableCredits: number;
	creditType: 'user' | 'space';
	operation?: string;
	spaceId?: string;
}

/**
 * Custom exception for insufficient credits scenarios
 * Uses HTTP 402 Payment Required status code
 */
export class InsufficientCreditsException extends HttpException {
	constructor(data: InsufficientCreditsErrorData) {
		const message = `Insufficient ${data.creditType} credits. Required: ${data.requiredCredits}, Available: ${data.availableCredits}`;

		const response = {
			statusCode: HttpStatus.PAYMENT_REQUIRED,
			error: 'InsufficientCredits',
			message,
			details: {
				requiredCredits: data.requiredCredits,
				availableCredits: data.availableCredits,
				creditType: data.creditType,
				operation: data.operation,
				spaceId: data.spaceId,
			},
		};

		super(response, HttpStatus.PAYMENT_REQUIRED);
	}
}

/**
 * Helper function to create standardized insufficient credits error
 */
export function createInsufficientCreditsError(
	requiredCredits: number,
	availableCredits: number,
	creditType: 'user' | 'space' = 'user',
	operation?: string,
	spaceId?: string
): InsufficientCreditsException {
	return new InsufficientCreditsException({
		requiredCredits,
		availableCredits,
		creditType,
		operation,
		spaceId,
	});
}

/**
 * Type guard to check if an error is an insufficient credits error
 */
export function isInsufficientCreditsError(error: any): error is InsufficientCreditsException {
	return (
		error instanceof InsufficientCreditsException ||
		(error instanceof HttpException && error.getStatus() === HttpStatus.PAYMENT_REQUIRED) ||
		error?.message?.toLowerCase().includes('insufficient credits')
	);
}

/**
 * Extract credit information from various error types
 */
export function extractCreditInfoFromError(error: any): {
	requiredCredits?: number;
	availableCredits?: number;
	creditType?: 'user' | 'space';
} | null {
	if (error instanceof InsufficientCreditsException) {
		const response = error.getResponse() as any;
		return response.details || null;
	}

	// Try to parse from error message
	const messageMatch = error?.message?.match(/Required:\s*(\d+),\s*Available:\s*(\d+)/);
	if (messageMatch) {
		return {
			requiredCredits: parseInt(messageMatch[1]),
			availableCredits: parseInt(messageMatch[2]),
			creditType: error.message.includes('space') ? 'space' : 'user',
		};
	}

	return null;
}
