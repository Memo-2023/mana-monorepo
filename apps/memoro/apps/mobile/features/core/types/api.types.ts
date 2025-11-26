/**
 * Core API types for standardized responses
 */

import { AppError } from './error.types';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: AppError;
  meta?: {
    timestamp: number;
    requestId?: string;
    duration?: number;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

/**
 * Type guard to check if response has data
 */
export function hasData<T>(response: ApiResponse<T>): response is ApiResponse<T> & { data: T } {
  return response.data !== undefined && response.data !== null;
}

/**
 * Type guard to check if response has error
 */
export function hasError(response: ApiResponse): response is ApiResponse & { error: AppError } {
  return response.error !== undefined && response.error !== null;
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return {
    data,
    meta: {
      timestamp: Date.now(),
      ...meta
    }
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(error: AppError, meta?: ApiResponse['meta']): ApiResponse {
  return {
    error,
    meta: {
      timestamp: Date.now(),
      ...meta
    }
  };
}