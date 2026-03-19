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
 * Create a storage client for the Mana Core Auth project (avatars, etc.)
 */
export function createManaCoreStorage(publicUrl?: string): StorageClient {
	return createStorageClient({
		name: BUCKETS.MANACORE,
		publicUrl: publicUrl ?? process.env.MANACORE_STORAGE_PUBLIC_URL,
	});
}

/**
 * Create a storage client for the Picture project
 */
export function createPictureStorage(publicUrl?: string): StorageClient {
	return createStorageClient({
		name: BUCKETS.PICTURE,
		publicUrl: publicUrl ?? process.env.PICTURE_STORAGE_PUBLIC_URL,
	});
}

/**
 * Create a storage client for the Chat project
 */
export function createChatStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.CHAT });
}

/**
 * Create a storage client for the ManaDeck project
 */
export function createManaDeckStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.MANADECK });
}

/**
 * Create a storage client for the NutriPhi project
 */
export function createNutriPhiStorage(publicUrl?: string): StorageClient {
	return createStorageClient({
		name: BUCKETS.NUTRIPHI,
		publicUrl: publicUrl ?? process.env.NUTRIPHI_S3_PUBLIC_URL,
	});
}

/**
 * Create a storage client for the Presi project
 */
export function createPresiStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.PRESI });
}

/**
 * Create a storage client for the Calendar project
 */
export function createCalendarStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.CALENDAR });
}

/**
 * Create a storage client for the Contacts project
 */
export function createContactsStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.CONTACTS });
}

/**
 * Create a storage client for the Storage project (cloud drive)
 */
export function createStorageStorage(publicUrl?: string): StorageClient {
	return createStorageClient({
		name: BUCKETS.STORAGE,
		publicUrl: publicUrl ?? process.env.STORAGE_S3_PUBLIC_URL,
	});
}

/**
 * Create a storage client for the Mail project
 */
export function createMailStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.MAIL });
}

/**
 * Create a storage client for the Inventory project
 */
export function createInventoryStorage(publicUrl?: string): StorageClient {
	return createStorageClient({
		name: BUCKETS.INVENTORY,
		publicUrl: publicUrl ?? process.env.INVENTORY_S3_PUBLIC_URL,
	});
}

/**
 * Create a storage client for the LightWrite project
 */
export function createLightWriteStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.LIGHTWRITE });
}

/**
 * Create a storage client for the Mukke project
 */
export function createMukkeStorage(): StorageClient {
	return createStorageClient({ name: BUCKETS.MUKKE });
}
