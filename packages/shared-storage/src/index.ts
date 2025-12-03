// Main client
export { StorageClient } from './client';

// Factory functions
export {
	createStorageClient,
	getStorageConfig,
	createPictureStorage,
	createChatStorage,
	createManaDeckStorage,
	createNutriPhiStorage,
	createPresiStorage,
	createCalendarStorage,
	createContactsStorage,
	createStorageStorage,
	createMailStorage,
} from './factory';

// Utilities
export {
	generateFileKey,
	generateUserFileKey,
	getContentType,
	validateFileSize,
	validateFileExtension,
	IMAGE_EXTENSIONS,
	DOCUMENT_EXTENSIONS,
	AUDIO_EXTENSIONS,
	VIDEO_EXTENSIONS,
} from './utils';

// Types
export {
	BUCKETS,
	type StorageConfig,
	type BucketConfig,
	type BucketName,
	type UploadOptions,
	type PresignedUrlOptions,
	type UploadResult,
	type FileInfo,
} from './types';
