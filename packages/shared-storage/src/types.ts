/**
 * Storage configuration for S3-compatible services
 */
export interface StorageConfig {
	/** S3 endpoint URL (e.g., http://localhost:9000 for MinIO) */
	endpoint: string;
	/** S3 region (e.g., 'us-east-1' or 'fsn1' for Hetzner) */
	region: string;
	/** Access key ID */
	accessKeyId: string;
	/** Secret access key */
	secretAccessKey: string;
	/** Force path-style URLs (required for MinIO) */
	forcePathStyle?: boolean;
}

/**
 * Bucket configuration for a specific project
 */
export interface BucketConfig {
	/** Bucket name */
	name: string;
	/** Public URL for accessing files (optional, for CDN/public buckets) */
	publicUrl?: string;
}

/**
 * Options for uploading files
 */
export interface UploadOptions {
	/** Content type (MIME type) */
	contentType?: string;
	/** Cache control header */
	cacheControl?: string;
	/** Custom metadata */
	metadata?: Record<string, string>;
	/** Make the object publicly readable */
	public?: boolean;
}

/**
 * Options for generating presigned URLs
 */
export interface PresignedUrlOptions {
	/** URL expiration in seconds (default: 3600 = 1 hour) */
	expiresIn?: number;
}

/**
 * Result of a file upload
 */
export interface UploadResult {
	/** The key/path of the uploaded file */
	key: string;
	/** Public URL if available */
	url?: string;
	/** ETag of the uploaded file */
	etag?: string;
}

/**
 * File info from listing
 */
export interface FileInfo {
	/** File key/path */
	key: string;
	/** File size in bytes */
	size: number;
	/** Last modified date */
	lastModified: Date;
	/** ETag */
	etag?: string;
}

/**
 * Predefined bucket names for each project
 */
export const BUCKETS = {
	MANACORE: 'manacore-storage',
	PICTURE: 'picture-storage',
	CHAT: 'chat-storage',
	MANADECK: 'manadeck-storage',
	NUTRIPHI: 'nutriphi-storage',
	PRESI: 'presi-storage',
	CALENDAR: 'calendar-storage',
	CONTACTS: 'contacts-storage',
	STORAGE: 'storage-storage',
	MAIL: 'mail-storage',
	INVENTORY: 'inventory-storage',
	LIGHTWRITE: 'lightwrite-storage',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
