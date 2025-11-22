/**
 * Credit-related error types
 */
export interface InsufficientCreditsError {
  error: 'insufficient_credits';
  message: string;
  requiredCredits: number;
  availableCredits: number;
}

/**
 * Type guard to check if an error is an insufficient credits error
 */
export function isInsufficientCreditsError(error: any): error is InsufficientCreditsError {
  return (
    error &&
    typeof error === 'object' &&
    error.error === 'insufficient_credits' &&
    typeof error.requiredCredits === 'number' &&
    typeof error.availableCredits === 'number'
  );
}

/**
 * Generic API error response
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode?: number;
}

/**
 * Parse API error from response
 */
export async function parseApiError(response: Response): Promise<InsufficientCreditsError | ApiError> {
  try {
    const errorData = await response.json();

    // Check if it's an insufficient credits error
    if (isInsufficientCreditsError(errorData)) {
      return errorData;
    }

    // Return generic API error
    return {
      error: errorData.error || 'api_error',
      message: errorData.message || `Request failed with status ${response.status}`,
      statusCode: response.status,
    };
  } catch {
    // If JSON parsing fails, return a generic error
    return {
      error: 'network_error',
      message: `Request failed with status ${response.status}`,
      statusCode: response.status,
    };
  }
}
