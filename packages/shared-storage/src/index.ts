// Main client
export { StorageClient } from './client';

// Factory functions
export {
	createStorage,
	createStorageClient,
	getStorageConfig,
	createManaCoreStorage,
	createPictureStorage,
	createChatStorage,
	createManaDeckStorage,
	createPresiStorage,
	createCalendarStorage,
	createContactsStorage,
	createStorageStorage,
	createMailStorage,
	createInventoryStorage,
	createMukkeStorage,
	createPlantaStorage,
	createProjectDocStorage,
} from './factory';

// Hooks
export { StorageHooks } from './hooks';
export type {
	StorageEventType,
	StorageEventMap,
	StorageHook,
	UploadEventPayload,
	DeleteEventPayload,
	DownloadEventPayload,
	ErrorEventPayload,
} from './hooks';

// Metrics
export { InMemoryMetrics, attachMetrics, createPrometheusCollector } from './metrics';
export type { StorageMetricsCollector, MetricsFactory } from './metrics';

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
	type MultipartUploadInit,
	type MultipartUploadPart,
	type UploadResult,
	type FileInfo,
	type FileMetadata,
} from './types';
