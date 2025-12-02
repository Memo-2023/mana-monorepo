// Main client
export { StorageClient } from './client.js';

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
} from './factory.js';

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
} from './utils.js';

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
} from './types.js';
