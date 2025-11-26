/**
 * Upload Status Tracking Types
 *
 * Defines types for tracking audio recording upload status in the audio archive.
 * Enables persistent status tracking across app restarts and provides data for UI feedback.
 */

import type { AudioFile } from './storage.types';

/**
 * Upload status for audio recordings
 */
export enum UploadStatus {
  /** Recording has never been uploaded */
  NOT_UPLOADED = 'not_uploaded',

  /** Upload is pending (queued for retry) */
  PENDING = 'pending',

  /** Currently uploading */
  UPLOADING = 'uploading',

  /** Upload completed successfully */
  SUCCESS = 'success',

  /** Upload failed after all retry attempts */
  FAILED = 'failed',
}

/**
 * Extended audio file metadata with upload tracking
 */
export interface AudioFileWithUploadStatus extends AudioFile {
  uploadStatus: UploadStatus;
  uploadMetadata?: UploadMetadata;
}

/**
 * Detailed metadata about upload attempts
 */
export interface UploadMetadata {
  /** Number of upload attempts made */
  attemptCount: number;

  /** Timestamp of last upload attempt */
  lastAttemptAt?: number;

  /** Timestamp of successful upload */
  uploadedAt?: number;

  /** Error message from last failed attempt */
  lastError?: string;

  /** Network error flag */
  isNetworkError?: boolean;

  /** Memo ID if upload was successful */
  memoId?: string;

  /** Queue ID for tracking in offline queue */
  queueId?: string;
}

/**
 * Persistent upload status record stored in AsyncStorage
 */
export interface UploadStatusRecord {
  /** Audio file ID (filename) */
  audioFileId: string;

  /** Current upload status */
  status: UploadStatus;

  /** Upload metadata */
  metadata: UploadMetadata;

  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Status update parameters
 */
export interface UploadStatusUpdate {
  status: UploadStatus;
  metadata?: Partial<UploadMetadata>;
}

/**
 * Bulk status update item
 */
export interface BulkStatusUpdate {
  audioFileId: string;
  status: UploadStatus;
  metadata?: Partial<UploadMetadata>;
}
