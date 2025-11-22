/**
 * User-friendly error messages and classifications
 * Maps technical errors to actionable, bilingual user messages
 */

export enum ErrorCategory {
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  GENERATION_FAILED = 'GENERATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface UserError {
  category: ErrorCategory;
  messageDE: string;
  messageEN: string;
  retryable: boolean;
  technicalPattern?: RegExp | string; // Pattern to match technical errors
}

/**
 * Comprehensive error mappings with bilingual messages
 */
export const USER_ERROR_MESSAGES: Record<ErrorCategory, UserError> = {
  [ErrorCategory.RATE_LIMIT]: {
    category: ErrorCategory.RATE_LIMIT,
    messageDE:
      'Unsere Server sind gerade ausgelastet. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
    messageEN:
      'Our servers are busy right now. Please wait a moment and try again.',
    retryable: true,
  },

  [ErrorCategory.NETWORK_ERROR]: {
    category: ErrorCategory.NETWORK_ERROR,
    messageDE:
      'Es gab ein Problem mit der Netzwerkverbindung. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    messageEN:
      'There was a problem with the network connection. Please check your internet connection and try again.',
    retryable: true,
  },

  [ErrorCategory.GENERATION_FAILED]: {
    category: ErrorCategory.GENERATION_FAILED,
    messageDE:
      'Die Generierung ist leider fehlgeschlagen. Bitte versuchen Sie es erneut. Falls das Problem weiterhin besteht, kontaktieren Sie uns bitte.',
    messageEN:
      'Generation failed. Please try again. If the problem persists, please contact us.',
    retryable: true,
  },

  [ErrorCategory.INVALID_INPUT]: {
    category: ErrorCategory.INVALID_INPUT,
    messageDE:
      'Die eingegebenen Daten sind ungültig. Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.',
    messageEN:
      'The input data is invalid. Please check your input and try again.',
    retryable: false,
  },

  [ErrorCategory.SERVICE_UNAVAILABLE]: {
    category: ErrorCategory.SERVICE_UNAVAILABLE,
    messageDE:
      'Der Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es in wenigen Minuten erneut.',
    messageEN:
      'The service is temporarily unavailable. Please try again in a few minutes.',
    retryable: true,
  },

  [ErrorCategory.INSUFFICIENT_CREDITS]: {
    category: ErrorCategory.INSUFFICIENT_CREDITS,
    messageDE:
      'Sie haben nicht genügend Credits für diese Aktion. Bitte laden Sie Ihr Guthaben auf.',
    messageEN:
      'You do not have enough credits for this action. Please top up your balance.',
    retryable: false,
  },

  [ErrorCategory.AUTHENTICATION_ERROR]: {
    category: ErrorCategory.AUTHENTICATION_ERROR,
    messageDE:
      'Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut an.',
    messageEN: 'Authentication failed. Please sign in again.',
    retryable: false,
  },

  [ErrorCategory.NOT_FOUND]: {
    category: ErrorCategory.NOT_FOUND,
    messageDE:
      'Die angeforderte Ressource wurde nicht gefunden. Bitte versuchen Sie es erneut.',
    messageEN: 'The requested resource was not found. Please try again.',
    retryable: false,
  },

  [ErrorCategory.UNKNOWN_ERROR]: {
    category: ErrorCategory.UNKNOWN_ERROR,
    messageDE:
      'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut. Falls das Problem weiterhin besteht, kontaktieren Sie uns bitte.',
    messageEN:
      'An unexpected error occurred. Please try again. If the problem persists, please contact us.',
    retryable: true,
  },
};

/**
 * Patterns to match Replicate API errors to categories
 */
export const REPLICATE_ERROR_PATTERNS: Array<{
  pattern: RegExp;
  category: ErrorCategory;
}> = [
  // Content policy violations (check first before other patterns)
  {
    pattern:
      /content policy|violates.*policy|inappropriate content|flagged as sensitive/i,
    category: ErrorCategory.INVALID_INPUT,
  },
  // Rate limiting
  {
    pattern: /rate limit|too many requests|429/i,
    category: ErrorCategory.RATE_LIMIT,
  },
  // Network errors
  {
    pattern: /network|timeout|ECONNREFUSED|ETIMEDOUT|fetch failed/i,
    category: ErrorCategory.NETWORK_ERROR,
  },
  // Service unavailable
  {
    pattern: /503|502|504|service unavailable|temporarily unavailable/i,
    category: ErrorCategory.SERVICE_UNAVAILABLE,
  },
  // Invalid input
  {
    pattern: /invalid.*input|validation failed|400|bad request/i,
    category: ErrorCategory.INVALID_INPUT,
  },
  // Authentication
  {
    pattern: /unauthorized|401|invalid.*key|authentication/i,
    category: ErrorCategory.AUTHENTICATION_ERROR,
  },
  // Model/generation specific errors
  {
    pattern: /model.*failed|generation.*failed|prediction.*failed/i,
    category: ErrorCategory.GENERATION_FAILED,
  },
];

/**
 * Helper function to categorize technical errors
 */
export function categorizeError(error: Error | string): ErrorCategory {
  const errorMessage = typeof error === 'string' ? error : error.message;

  // Check against known patterns
  for (const { pattern, category } of REPLICATE_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return category;
    }
  }

  // Default to unknown error
  return ErrorCategory.UNKNOWN_ERROR;
}

/**
 * Get user-friendly error based on technical error
 */
export function getUserFriendlyError(
  error: Error | string,
  defaultCategory?: ErrorCategory,
): UserError {
  const category = defaultCategory || categorizeError(error);
  return USER_ERROR_MESSAGES[category];
}
