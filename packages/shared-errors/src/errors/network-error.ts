import { ErrorCode } from '../types/error-codes';
import { AppError } from './app-error';
import type { ErrorContext } from './app-error';

type NetworkErrorCode = ErrorCode.NETWORK_ERROR | ErrorCode.TIMEOUT | ErrorCode.CONNECTION_REFUSED;

/**
 * Error for network-level failures (timeouts, connection issues, etc.).
 * HTTP Status: 502 (gateway), 503 (connection refused), 504 (timeout)
 *
 * @example
 * ```typescript
 * // Timeout
 * return err(NetworkError.timeout('Fetching user profile'));
 *
 * // Connection refused
 * return err(NetworkError.connectionRefused('Database'));
 *
 * // Generic network error
 * return err(new NetworkError(ErrorCode.NETWORK_ERROR, 'DNS resolution failed'));
 * ```
 */
export class NetworkError extends AppError {
	constructor(code: NetworkErrorCode, message: string, cause?: Error, context?: ErrorContext) {
		super({ code, message, cause, context });
		this.name = 'NetworkError';
	}

	/**
	 * Create a timeout error.
	 *
	 * @param operation - Description of the operation that timed out
	 */
	static timeout(operation: string): NetworkError {
		return new NetworkError(ErrorCode.TIMEOUT, `Operation timed out: ${operation}`, undefined, {
			operation,
		});
	}

	/**
	 * Create a connection refused error.
	 *
	 * @param service - Name of the service that refused connection
	 */
	static connectionRefused(service: string): NetworkError {
		return new NetworkError(
			ErrorCode.CONNECTION_REFUSED,
			`Connection refused: ${service}`,
			undefined,
			{ service }
		);
	}
}
