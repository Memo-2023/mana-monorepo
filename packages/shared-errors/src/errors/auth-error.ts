import { ErrorCode } from '../types/error-codes';
import { AppError, type ErrorContext } from './app-error';

type AuthErrorCode =
  | ErrorCode.AUTHENTICATION_REQUIRED
  | ErrorCode.INVALID_TOKEN
  | ErrorCode.TOKEN_EXPIRED
  | ErrorCode.PERMISSION_DENIED
  | ErrorCode.RESOURCE_NOT_OWNED;

/**
 * Error for authentication and authorization failures.
 * HTTP Status: 401 (auth) or 403 (authorization)
 *
 * @example
 * ```typescript
 * // Authentication errors (401)
 * return err(AuthError.unauthorized());
 * return err(AuthError.invalidToken('Token has been revoked'));
 * return err(AuthError.tokenExpired());
 *
 * // Authorization errors (403)
 * return err(AuthError.forbidden('Admin access required'));
 * return err(AuthError.notOwned('Story', storyId));
 * ```
 */
export class AuthError extends AppError {
  constructor(code: AuthErrorCode, message: string, context?: ErrorContext) {
    super({ code, message, context });
    this.name = 'AuthError';
  }

  /**
   * Create an error for missing authentication.
   * HTTP 401 Unauthorized
   */
  static unauthorized(message = 'Authentication required'): AuthError {
    return new AuthError(ErrorCode.AUTHENTICATION_REQUIRED, message);
  }

  /**
   * Create an error for an invalid token.
   * HTTP 401 Unauthorized
   */
  static invalidToken(message = 'Invalid or malformed token'): AuthError {
    return new AuthError(ErrorCode.INVALID_TOKEN, message);
  }

  /**
   * Create an error for an expired token.
   * HTTP 401 Unauthorized
   */
  static tokenExpired(message = 'Token has expired'): AuthError {
    return new AuthError(ErrorCode.TOKEN_EXPIRED, message);
  }

  /**
   * Create an error for insufficient permissions.
   * HTTP 403 Forbidden
   */
  static forbidden(message = 'Permission denied'): AuthError {
    return new AuthError(ErrorCode.PERMISSION_DENIED, message);
  }

  /**
   * Create an error when a user tries to access a resource they don't own.
   * HTTP 403 Forbidden
   *
   * @param resourceType - Type of resource (e.g., 'Story', 'Character')
   * @param resourceId - ID of the resource
   */
  static notOwned(resourceType: string, resourceId: string): AuthError {
    return new AuthError(
      ErrorCode.RESOURCE_NOT_OWNED,
      `${resourceType} does not belong to you`,
      { resourceType, resourceId }
    );
  }
}
