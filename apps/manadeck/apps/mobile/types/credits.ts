/**
 * Credit-related types for Manadeck
 */

export interface CreditBalance {
  userId: string;
  balance: number;
  currency: string;
  timestamp: string;
}

export interface InsufficientCreditsError {
  error: 'insufficient_credits';
  message: string;
  requiredCredits: number;
  availableCredits: number;
  operation?: string;
}

export interface CreditResponse {
  success?: boolean;
  creditsUsed?: number;
  error?: string;
  message?: string;
  requiredCredits?: number;
  availableCredits?: number;
  operation?: string;
}

/**
 * Check if an error response is an insufficient credits error
 */
export function isInsufficientCreditsError(error: any): error is InsufficientCreditsError {
  return error && error.error === 'insufficient_credits';
}

/**
 * Extract credit error details from an API error response
 */
export function extractCreditError(error: any): InsufficientCreditsError | null {
  if (isInsufficientCreditsError(error)) {
    return error;
  }

  // Check if it's nested in a response
  if (error?.response?.data && isInsufficientCreditsError(error.response.data)) {
    return error.response.data;
  }

  return null;
}
