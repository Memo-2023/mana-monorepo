/**
 * Credit utility exports
 * Centralized export for all credit-related utilities
 */

// Credit error handler
export {
  CreditErrorHandler,
  CreditErrorHandlerOptions,
  defaultCreditErrorHandler,
  handleCreditError,
  useCreditErrorHandler
} from './credit-error-handler';

// Re-export credit error types for convenience
export {
  CreditErrorCode,
  CreditType,
  CreditErrorDetails,
  CreditError,
  CreditErrorResponse,
  isCreditErrorResponse,
  isInsufficientCreditsError,
  isCreditValidationError,
  isCreditSystemError,
  extractCreditErrorDetails,
  getCreditErrorMessage,
  formatCredits,
  createCreditErrorResponse
} from '~/features/core/types/credit-error.types';