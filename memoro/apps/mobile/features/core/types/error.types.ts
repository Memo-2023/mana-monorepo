/**
 * Core error types for the application
 */

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

export interface NetworkError extends AppError {
  code: 'NETWORK_ERROR';
  statusCode: number;
  url?: string;
}

export interface AuthError extends AppError {
  code: 'AUTH_ERROR' | 'TOKEN_EXPIRED' | 'UNAUTHORIZED';
  statusCode: 401 | 403;
}

export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  fields?: Record<string, string[]>;
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as any).code === 'string' &&
    typeof (error as any).message === 'string'
  );
}

/**
 * Type guard to check if an error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return isAppError(error) && error.code === 'NETWORK_ERROR';
}

/**
 * Type guard to check if an error is an AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return isAppError(error) && (
    error.code === 'AUTH_ERROR' || 
    error.code === 'TOKEN_EXPIRED' || 
    error.code === 'UNAUTHORIZED'
  );
}

/**
 * Parse unknown errors into AppError format
 */
export function parseError(error: unknown): AppError {
  // If it's already an AppError, return it
  if (isAppError(error)) {
    return error;
  }

  // If it's a standard Error object
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Network request failed')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed. Please check your internet connection.',
        statusCode: 0
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack
      }
    };
  }

  // If it's a string
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN_ERROR',
      message: error
    };
  }

  // Default case
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error
  };
}

/**
 * Create a standardized error
 */
export function createError(
  code: string,
  message: string,
  details?: unknown,
  statusCode?: number
): AppError {
  return {
    code,
    message,
    details,
    statusCode
  };
}