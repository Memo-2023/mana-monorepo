import { ErrorCode } from '../types/error-codes';
import { AppError } from './app-error';
import type { ErrorContext } from './app-error';

/**
 * Error for validation failures (invalid input, missing fields, etc.).
 * HTTP Status: 400 Bad Request
 *
 * @example
 * ```typescript
 * // Using factory methods
 * return err(ValidationError.invalidInput('email', 'must be a valid email address'));
 * return err(ValidationError.missingField('password'));
 *
 * // Direct construction
 * return err(new ValidationError('Age must be a positive number', { field: 'age' }));
 * ```
 */
export class ValidationError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super({
			code: ErrorCode.VALIDATION_FAILED,
			message,
			context,
		});
		this.name = 'ValidationError';
	}

	/**
	 * Create a validation error for an invalid field value.
	 *
	 * @param field - The field name that failed validation
	 * @param reason - Why the validation failed
	 */
	static invalidInput(field: string, reason: string): ValidationError {
		return new ValidationError(`Invalid ${field}: ${reason}`, { field, reason });
	}

	/**
	 * Create a validation error for a missing required field.
	 *
	 * @param field - The field name that is missing
	 */
	static missingField(field: string): ValidationError {
		return new ValidationError(`Missing required field: ${field}`, { field });
	}

	/**
	 * Create a validation error for an invalid format.
	 *
	 * @param field - The field name with invalid format
	 * @param expectedFormat - Description of the expected format
	 */
	static invalidFormat(field: string, expectedFormat: string): ValidationError {
		return new ValidationError(`Invalid format for ${field}: expected ${expectedFormat}`, {
			field,
			expectedFormat,
		});
	}
}
