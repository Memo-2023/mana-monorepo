/**
 * Types for the storage feature
 */

/**
 * Interface for a stored audio file
 */
export interface AudioFile {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  createdAt: Date;
  size?: number;
}

/**
 * Interface for a photo stored in memo.source
 */
export interface MemoPhoto {
  path: string;
  type: 'photo';
  filename: string;
  signedUrl?: string;
  uploadedAt: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  metadata?: {
    originalName?: string;
    mimeType?: string;
    orientation?: number;
  };
}

/**
 * Result type for photo upload operations
 */
export interface PhotoUploadResult {
  success: boolean;
  photo?: MemoPhoto;
  error?: string;
}

/**
 * Configuration for photo processing
 */
export interface PhotoProcessingConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png';
}

/**
 * Default photo processing configuration
 */
export const DEFAULT_PHOTO_CONFIG: PhotoProcessingConfig = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'jpeg'
};

// Note: Audio upload related types have been removed as they are no longer needed
