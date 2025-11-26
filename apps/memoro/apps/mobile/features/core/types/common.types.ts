/**
 * Common type definitions used throughout the application
 */

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific properties of T required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specific properties of T optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the type of array elements
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Common async state
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Common pagination params
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Common filter params
 */
export interface FilterParams {
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  [key: string]: unknown;
}

/**
 * Common timestamp fields
 */
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/**
 * Common ID field
 */
export interface WithId {
  id: string;
}

/**
 * Platform types
 */
export type Platform = 'ios' | 'android' | 'web';

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * Optional type helper
 */
export type Optional<T> = T | undefined;

/**
 * Type guard to check if value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Type guard to check if value is string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if value is number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if value is boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard to check if value is object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}