/**
 * Shared constants across the application
 * Consolidates magic numbers and commonly used values
 */

// Time constants (in milliseconds)
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Time constants (in seconds)
export const TIME_SEC = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
} as const;

// Debounce delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  FAST: 300,
  NORMAL: 500,
  SLOW: 1000,
  SEARCH: 300,
  INPUT: 500,
} as const;

// Common timeouts
export const TIMEOUTS = {
  SIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
  NETWORK_REQUEST: 30000, // 30 seconds
  SHORT_OPERATION: 5000, // 5 seconds
} as const;

// Common spacing/sizing values
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
} as const;

// Date format constants (deprecated - use toLocaleDateString instead)
// Kept for backwards compatibility, will be removed in future versions
export const DATE_FORMAT = {
  WEEKDAYS: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const,
  MONTHS: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ] as const,
} as const;

// Common text limits
export const TEXT_LIMITS = {
  MEMO_TITLE_MAX: 100,
  TAG_NAME_MAX: 50,
  SPACE_NAME_MAX: 100,
  DESCRIPTION_MAX: 500,
} as const;