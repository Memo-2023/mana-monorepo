import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../i18n';

export interface ApiError {
  error?: string;
  messageDE?: string;
  messageEN?: string;
  retryable?: boolean;
  technicalMessage?: string;
}

interface ErrorAlertProps {
  error: ApiError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Shows a user-friendly error alert based on the error type
 * Supports bilingual messages from the backend
 * NOTE: This is a plain function, not a React component, so we can't use hooks
 */
export const showErrorAlert = ({ error, onRetry, onDismiss }: ErrorAlertProps) => {
  if (!error) return;

  const currentLang = getCurrentLanguage();

  const supportTextDE = '\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.';
  const supportTextEN = '\n\nIf the problem persists, please contact us at support@manacore.ai';

  let messageDE = 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' + supportTextDE;
  let messageEN = 'An unexpected error occurred. Please try again.' + supportTextEN;
  let retryable = true;

  // Handle API errors with user-friendly messages from backend
  if (typeof error === 'object' && error !== null && 'messageDE' in error) {
    const apiError = error as ApiError;
    messageDE = (apiError.messageDE || messageDE) + supportTextDE;
    messageEN = (apiError.messageEN || messageEN) + supportTextEN;
    retryable = apiError.retryable !== false;
  }
  // Handle standard Error objects
  else if (error instanceof Error) {
    // Use default messages for standard errors
    messageDE = 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.' + supportTextDE;
    messageEN = 'An error occurred. Please try again.' + supportTextEN;
  }
  // Handle string errors
  else if (typeof error === 'string') {
    messageDE = error + supportTextDE;
    messageEN = error + supportTextEN;
  }

  const message = currentLang === 'de' ? messageDE : messageEN;
  const title = currentLang === 'de' ? 'Fehler' : 'Error';
  const tryAgainText = currentLang === 'de' ? 'Erneut versuchen' : 'Try Again';
  const cancelText = currentLang === 'de' ? 'Abbrechen' : 'Cancel';
  const okText = currentLang === 'de' ? 'OK' : 'OK';

  // Build alert buttons
  const buttons: any[] = [];

  if (retryable && onRetry) {
    buttons.push({
      text: tryAgainText,
      onPress: onRetry,
      style: 'default',
    });
    buttons.push({
      text: cancelText,
      onPress: onDismiss,
      style: 'cancel',
    });
  } else {
    buttons.push({
      text: okText,
      onPress: onDismiss,
      style: 'default',
    });
  }

  Alert.alert(title, message, buttons);
};

/**
 * Hook for showing error alerts with translation support
 */
export const useErrorAlert = () => {
  const { t } = useTranslation();

  const showError = React.useCallback(
    ({ error, onRetry, onDismiss }: ErrorAlertProps) => {
      showErrorAlert({ error, onRetry, onDismiss });
    },
    [t]
  );

  return { showError };
};

/**
 * Map error category from backend to translation key
 */
export const getErrorTranslationKey = (errorCategory?: string): string => {
  if (!errorCategory) return 'errors.unknown';

  const categoryMap: Record<string, string> = {
    RATE_LIMIT: 'errors.rateLimit',
    NETWORK_ERROR: 'errors.networkError',
    GENERATION_FAILED: 'errors.generationFailed',
    INVALID_INPUT: 'errors.invalidInput',
    SERVICE_UNAVAILABLE: 'errors.serviceUnavailable',
    INSUFFICIENT_CREDITS: 'errors.insufficientCredits',
    AUTHENTICATION_ERROR: 'errors.authenticationError',
    NOT_FOUND: 'errors.notFound',
    UNKNOWN_ERROR: 'errors.unknown',
  };

  return categoryMap[errorCategory] || 'errors.unknown';
};
