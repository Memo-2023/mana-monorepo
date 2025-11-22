/**
 * Handles insufficient credits errors with the new standardized format
 */

interface InsufficientCreditsError {
  error: {
    code: string;
    message: string;
    details: {
      requiredCredits: number;
      availableCredits: number;
      creditType: 'user' | 'space';
      operation: string;
      operationCost: number;
      spaceId?: string;
      suggestions?: string[];
    };
  };
  statusCode: number;
  timestamp: string;
  path: string;
}

/**
 * Check if an error response is an insufficient credits error
 */
export function isInsufficientCreditsError(error: any): error is InsufficientCreditsError {
  return (
    error?.statusCode === 402 ||
    error?.error?.code === 'INSUFFICIENT_CREDITS' ||
    (error?.message && error.message.includes('Insufficient credits')) ||
    (error?.message && error.message.includes('Nicht genügend Mana'))
  );
}

/**
 * Parse error response to extract credit information
 */
export function parseInsufficientCreditsError(error: any): {
  requiredCredits?: number;
  availableCredits?: number;
  creditType?: 'user' | 'space';
  operation?: string;
  spaceId?: string;
  suggestions?: string[];
} {
  // Handle new standardized format from memoro-service
  if (error?.details) {
    return {
      requiredCredits: error.details.requiredCredits,
      availableCredits: error.details.availableCredits,
      creditType: error.details.creditType,
      operation: error.details.operation,
      spaceId: error.details.spaceId,
      suggestions: error.details.suggestions
    };
  }

  // Handle nested error object
  if (error?.error?.details) {
    return {
      requiredCredits: error.error.details.requiredCredits,
      availableCredits: error.error.details.availableCredits,
      creditType: error.error.details.creditType,
      operation: error.error.details.operation,
      spaceId: error.error.details.spaceId,
      suggestions: error.error.details.suggestions
    };
  }

  // Handle legacy format with message parsing
  const message = error?.message || error?.error?.message || '';
  if (message) {
    const requiredMatch = message.match(/Required:\s*(\d+)/);
    const availableMatch = message.match(/Available:\s*(\d+)/);
    
    return {
      requiredCredits: requiredMatch ? parseInt(requiredMatch[1]) : undefined,
      availableCredits: availableMatch ? parseInt(availableMatch[1]) : undefined,
      creditType: message.includes('space') ? 'space' : 'user',
      operation: 'transcription' // Default operation
    };
  }

  return {};
}

/**
 * Format insufficient credits message for display
 */
export function formatInsufficientCreditsMessage(
  errorData: ReturnType<typeof parseInsufficientCreditsError>,
  t: (key: string, fallback: string) => string
): string {
  if (errorData.requiredCredits && errorData.availableCredits !== undefined) {
    return t(
      'credits.insufficient_detailed',
      `Du benötigst ${errorData.requiredCredits} Mana, hast aber nur ${errorData.availableCredits} verfügbar.`
    );
  }
  
  return t(
    'credits.insufficient_message',
    'Du hast nicht genügend Mana für diese Operation.'
  );
}