import { HttpException, HttpStatus } from '@nestjs/common';

export interface InsufficientCreditsDetails {
	requiredCredits: number;
	availableCredits: number;
	creditType: 'user' | 'app';
	operation: string;
}

export class InsufficientCreditsException extends HttpException {
	constructor(details: InsufficientCreditsDetails) {
		super(
			{
				statusCode: HttpStatus.PAYMENT_REQUIRED,
				error: 'Insufficient Credits',
				message: `Not enough credits for ${details.operation}. Required: ${details.requiredCredits}, Available: ${details.availableCredits}`,
				details,
			},
			HttpStatus.PAYMENT_REQUIRED
		);
	}
}
