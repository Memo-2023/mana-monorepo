/**
 * Common utility types
 */

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the type from a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * Nullable type
 */
export type Nullable<T> = T | null;

/**
 * Maybe type (nullable and optional)
 */
export type Maybe<T> = T | null | undefined;

/**
 * Dictionary type
 */
export type Dictionary<T = unknown> = Record<string, T>;

/**
 * ID type (for entities)
 */
export type ID = string;

/**
 * Timestamp type
 */
export type Timestamp = string; // ISO 8601 format

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration
 */
export interface SortConfig<T = string> {
  field: T;
  direction: SortDirection;
}

/**
 * Filter operator
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';

/**
 * Filter configuration
 */
export interface FilterConfig<T = string> {
  field: T;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Entity with timestamps
 */
export interface TimestampedEntity {
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * Entity with user ownership
 */
export interface OwnedEntity extends TimestampedEntity {
  user_id: ID;
}

/**
 * Locale code
 */
export type LocaleCode = 'en' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl' | 'pl' | 'ru' | 'ja' | 'ko' | 'zh';

/**
 * Localized string
 */
export type LocalizedString = {
  [key in LocaleCode]?: string;
};

/**
 * Event handler type
 */
export type EventHandler<T = void> = (event: T) => void;

/**
 * Callback type
 */
export type Callback<T = void> = () => T;

/**
 * Async callback type
 */
export type AsyncCallback<T = void> = () => Promise<T>;
