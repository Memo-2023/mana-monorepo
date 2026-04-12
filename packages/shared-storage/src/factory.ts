import { StorageClient } from './client';
import { BUCKETS } from './types';
import type { StorageConfig, BucketConfig, BucketName } from './types';

/**
 * Environment variable names for storage configuration
 */
const ENV_KEYS = {
	ENDPOINT: 'S3_ENDPOINT',
	PUBLIC_ENDPOINT: 'S3_PUBLIC_ENDPOINT',
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
 * Mapping of bucket keys to their public URL environment variable names
 */
const PUBLIC_URL_ENV: Partial<Record<keyof typeof BUCKETS, string>> = {
	MANA: 'MANA_STORAGE_PUBLIC_URL',
	PICTURE: 'PICTURE_STORAGE_PUBLIC_URL',
	STORAGE: 'STORAGE_S3_PUBLIC_URL',
	INVENTORY: 'INVENTORY_S3_PUBLIC_URL',
	PLANTS: 'PLANTS_STORAGE_PUBLIC_URL',
};

/**
 * Get storage configuration from environment variables
 * Falls back to MinIO defaults in development
 */
export function getStorageConfig(): StorageConfig {
	const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
	const endpoint = process.env[ENV_KEYS.ENDPOINT] ?? (isDev ? MINIO_DEFAULTS.endpoint : '');

	// Use environment variables if available, otherwise use MinIO defaults
	return {
		endpoint,
		publicEndpoint: process.env[ENV_KEYS.PUBLIC_ENDPOINT],
		region: process.env[ENV_KEYS.REGION] ?? MINIO_DEFAULTS.region,
		accessKeyId: process.env[ENV_KEYS.ACCESS_KEY] ?? (isDev ? MINIO_DEFAULTS.accessKeyId : ''),
		secretAccessKey:
			process.env[ENV_KEYS.SECRET_KEY] ?? (isDev ? MINIO_DEFAULTS.secretAccessKey : ''),
		forcePathStyle: isDev || endpoint?.includes('localhost') || endpoint?.includes('minio'),
	};
}

/**
 * Create a storage client for a specific bucket
 */
export function createStorageClient(
	bucket: BucketName | BucketConfig,
	config?: Partial<StorageConfig>
): StorageClient {
	const storageConfig = {
		...getStorageConfig(),
		...config,
	};

	const bucketConfig: BucketConfig = typeof bucket === 'string' ? { name: bucket } : bucket;

	// Validate configuration
	if (!storageConfig.endpoint) {
		throw new Error('S3_ENDPOINT is required for storage configuration');
	}
	if (!storageConfig.accessKeyId || !storageConfig.secretAccessKey) {
		throw new Error('S3_ACCESS_KEY and S3_SECRET_KEY are required');
	}

	return new StorageClient(storageConfig, bucketConfig);
}

/**
 * Create a storage client for a project by bucket key.
 * Automatically resolves the public URL and CDN URL from environment variables.
 *
 * @example
 * const storage = createStorage('PICTURE');
 * const storage = createStorage('CHAT');
 */
export function createStorage(bucketKey: keyof typeof BUCKETS, publicUrl?: string): StorageClient {
	const envKey = PUBLIC_URL_ENV[bucketKey];
	const cdnEnvKey = `${bucketKey}_CDN_URL`;
	return createStorageClient({
		name: BUCKETS[bucketKey],
		publicUrl: publicUrl ?? (envKey ? process.env[envKey] : undefined),
		cdnUrl: process.env[cdnEnvKey],
	});
}

// Convenience aliases for backward compatibility

export const createManaStorage = (publicUrl?: string) => createStorage('MANA', publicUrl);
export const createPictureStorage = (publicUrl?: string) => createStorage('PICTURE', publicUrl);
export const createChatStorage = () => createStorage('CHAT');
export const createCardsStorage = () => createStorage('CARDS');
export const createPresiStorage = () => createStorage('PRESI');
export const createCalendarStorage = () => createStorage('CALENDAR');
export const createContactsStorage = () => createStorage('CONTACTS');
export const createStorageStorage = (publicUrl?: string) => createStorage('STORAGE', publicUrl);
export const createMailStorage = () => createStorage('MAIL');
export const createInventoryStorage = (publicUrl?: string) => createStorage('INVENTORY', publicUrl);
export const createMusicStorage = () => createStorage('MUSIC');
export const createPlantsStorage = (publicUrl?: string) => createStorage('PLANTS', publicUrl);
export const createProjectDocStorage = () => createStorage('PROJECTDOC');
