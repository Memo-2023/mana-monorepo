import { ErrorCode } from '../types/error-codes';
import { AppError, type ErrorContext } from './app-error';

type DatabaseErrorCode = ErrorCode.DATABASE_ERROR | ErrorCode.CONSTRAINT_VIOLATION;

/**
 * Error for database-level failures.
 * HTTP Status: 500 (database), 409 (constraint violation)
 *
 * @example
 * ```typescript
 * // Constraint violation (e.g., unique constraint)
 * return err(DatabaseError.constraintViolation('email', 'Email already exists'));
 *
 * // Generic database error
 * return err(DatabaseError.queryFailed('Failed to fetch user data', originalError));
 * ```
 */
export class DatabaseError extends AppError {
	constructor(code: DatabaseErrorCode, message: string, cause?: Error, context?: ErrorContext) {
		super({ code, message, cause, context });
		this.name = 'DatabaseError';
	}

	/**
	 * Create a constraint violation error (e.g., unique constraint).
	 *
	 * @param field - The field that violated the constraint
	 * @param message - Description of the violation
	 */
	static constraintViolation(field: string, message: string): DatabaseError {
		return new DatabaseError(ErrorCode.CONSTRAINT_VIOLATION, message, undefined, { field });
	}

	/**
	 * Create a generic database query error.
	 *
	 * @param message - Description of what went wrong
	 * @param cause - Original error if available
	 */
	static queryFailed(message: string, cause?: Error): DatabaseError {
		return new DatabaseError(ErrorCode.DATABASE_ERROR, message, cause);
	}
}
