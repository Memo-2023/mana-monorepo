import { ErrorCategory } from '../consts/user-errors.const';

// Success type with null error and defined data
export type Success<T> = {
  data: T;
  error: null;
};

// Error metadata for user-friendly error handling
export interface ErrorMetadata {
  category?: ErrorCategory;
  messageDE?: string;
  messageEN?: string;
  retryable?: boolean;
  technicalDetails?: string;
}

// Error type with error details and null data
export type Failure = {
  data: null;
  error: any;
  errorMetadata?: ErrorMetadata;
};

// Result type combining Success and Failure
export type Result<T> = Success<T> | Failure;

// Helper function to create a success result
export function createSuccess<T>(data: T): Success<T> {
  return { data, error: null };
}

// Helper function to create a failure result with metadata
export function createFailure(error: any, metadata?: ErrorMetadata): Failure {
  return {
    data: null,
    error,
    errorMetadata: metadata,
  };
}
