import { StorageClient } from './client';
import { UNIFIED_BUCKET, APPS } from './types';
import type { StorageConfig, BucketConfig, AppName } from './types';

/**
 * Environment variable names for storage configuration
 */
const ENV_KEYS = {
	ENDPOINT: 'S3_ENDPOINT',
	REGION: 'S3_REGION',
	ACCESS_KEY: 'S3_ACCESS_KEY',
	SECRET_KEY: 'S3_SECRET_KEY',
} as const;

/**
 * Default configuration for local MinIO development
 */
const MINIO_DEFAULTS: StorageConfig = {
	endpoint: 'http://localhost:9000',
	region: 'us-east-1',
	accessKeyId: 'minioadmin',
	secretAccessKey: 'minioadmin',
	forcePathStyle: true,
};

/**
 * Get storage configuration from environment variables
 * Falls back to MinIO defaults in development
 */
export function getStorageConfig(): StorageConfig {
	const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

	return {
		endpoint: process.env[ENV_KEYS.ENDPOINT] ?? (isDev ? MINIO_DEFAULTS.endpoint : ''),
		region: process.env[ENV_KEYS.REGION] ?? MINIO_DEFAULTS.region,
		accessKeyId: process.env[ENV_KEYS.ACCESS_KEY] ?? (isDev ? MINIO_DEFAULTS.accessKeyId : ''),
		secretAccessKey:
			process.env[ENV_KEYS.SECRET_KEY] ?? (isDev ? MINIO_DEFAULTS.secretAccessKey : ''),
		forcePathStyle: isDev || process.env[ENV_KEYS.ENDPOINT]?.includes('localhost'),
	};
}

/**
 * Create a storage client for a specific bucket
 */
export function createStorageClient(
	bucket: string | BucketConfig,
	config?: Partial<StorageConfig>
): StorageClient {
	const storageConfig = {
		...getStorageConfig(),
		...config,
	};

	const bucketConfig: BucketConfig = typeof bucket === 'string' ? { name: bucket } : bucket;

	if (!storageConfig.endpoint) {
		throw new Error('S3_ENDPOINT is required for storage configuration');
	}
	if (!storageConfig.accessKeyId || !storageConfig.secretAccessKey) {
		throw new Error('S3_ACCESS_KEY and S3_SECRET_KEY are required');
	}

	return new StorageClient(storageConfig, bucketConfig);
}

/**
 * Create the unified storage client for all Manacore apps
 *
 * Uses a single bucket with folder structure: {userId}/{appName}/...
 *
 * @example
 * import { createUnifiedStorage, generateStorageKey, APPS } from '@manacore/shared-storage';
 *
 * const storage = createUnifiedStorage();
 *
 * // Upload for a specific user and app
 * const key = generateStorageKey('user-123', APPS.PICTURE, 'photo.jpg');
 * await storage.upload(key, imageBuffer, { contentType: 'image/jpeg', public: true });
 *
 * // List all files for a user in an app
 * const files = await storage.list('user-123/picture/');
 */
export function createUnifiedStorage(publicUrl?: string): StorageClient {
	return createStorageClient({
		name: UNIFIED_BUCKET,
		publicUrl: publicUrl ?? process.env.MANACORE_STORAGE_PUBLIC_URL,
	});
}

/**
 * Re-export constants and types for convenience
 */
export { UNIFIED_BUCKET, APPS };
export type { AppName };
