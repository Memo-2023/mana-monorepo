// Main client
export { StorageClient } from './client';

// Factory functions
export {
	createStorageClient,
	createUnifiedStorage,
	getStorageConfig,
	UNIFIED_BUCKET,
	APPS,
} from './factory';

// Utilities
export {
	generateFileKey,
	generateUserFileKey,
	generateStorageKey,
	getContentType,
	validateFileSize,
	validateFileExtension,
	IMAGE_EXTENSIONS,
	DOCUMENT_EXTENSIONS,
	AUDIO_EXTENSIONS,
	VIDEO_EXTENSIONS,
} from './utils';

// Types
export type {
	StorageConfig,
	BucketConfig,
	AppName,
	UploadOptions,
	PresignedUrlOptions,
	UploadResult,
	FileInfo,
} from './types';
