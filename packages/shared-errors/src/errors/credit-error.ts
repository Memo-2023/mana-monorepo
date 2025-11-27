import { ErrorCode } from '../types/error-codes';
import { AppError } from './app-error';

/**
 * Error for insufficient credits/mana.
 * HTTP Status: 402 Payment Required
 *
 * @example
 * ```typescript
 * return err(new CreditError(100, 50, 'story_generation'));
 * // Message: "Insufficient credits. Required: 100, Available: 50"
 * ```
 */
export class CreditError extends AppError {
	/** Credits required for the operation */
	readonly requiredCredits: number;

	/** Credits currently available */
	readonly availableCredits: number;

	constructor(requiredCredits: number, availableCredits: number, operation?: string) {
		super({
			code: ErrorCode.INSUFFICIENT_CREDITS,
			message: `Insufficient credits. Required: ${requiredCredits}, Available: ${availableCredits}`,
			context: { requiredCredits, availableCredits, operation },
		});
		this.name = 'CreditError';
		this.requiredCredits = requiredCredits;
		this.availableCredits = availableCredits;
	}
}
