/**
 * Storage configuration for S3-compatible services
 */
export interface StorageConfig {
	/** S3 endpoint URL (e.g., http://localhost:9000 for MinIO) */
	endpoint: string;
	/** S3 region (e.g., 'us-east-1') */
	region: string;
	/** Access key ID */
	accessKeyId: string;
	/** Secret access key */
	secretAccessKey: string;
	/** Force path-style URLs (required for MinIO) */
	forcePathStyle?: boolean;
	/**
	 * Public endpoint for generating presigned URLs accessible from browsers.
	 * Use this when the internal endpoint (e.g., http://minio:9000) differs
	 * from the public URL (e.g., https://minio.mana.how).
	 * If not set, presigned URLs use the main endpoint.
	 */
	publicEndpoint?: string;
}

/**
 * Bucket configuration for a specific project
 */
export interface BucketConfig {
	/** Bucket name */
	name: string;
	/** Public URL for accessing files (optional, for CDN/public buckets) */
	publicUrl?: string;
	/**
	 * CDN URL prefix for serving files (e.g., https://cdn.mana.how/picture).
	 * When set, getCdnUrl() returns URLs through the CDN instead of direct S3 access.
	 */
	cdnUrl?: string;
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
	/** Maximum allowed file size in bytes. Throws if body exceeds this limit. */
	maxSizeBytes?: number;
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
 * Metadata for a stored file (from HeadObject)
 */
export interface FileMetadata {
	/** Content type (MIME type) */
	contentType?: string;
	/** File size in bytes */
	size: number;
	/** Last modified date */
	lastModified?: Date;
	/** ETag */
	etag?: string;
	/** Custom metadata */
	metadata?: Record<string, string>;
}

/**
 * Multipart upload initialization result
 */
export interface MultipartUploadInit {
	/** S3 upload ID for this multipart upload session */
	uploadId: string;
	/** Object key */
	key: string;
}

/**
 * A completed part of a multipart upload
 */
export interface MultipartUploadPart {
	/** 1-based part number */
	partNumber: number;
	/** ETag returned by S3 after uploading the part */
	etag: string;
}

/**
 * Predefined bucket names for each project
 */
export const BUCKETS = {
	MANACORE: 'mana-storage',
	PICTURE: 'picture-storage',
	CHAT: 'chat-storage',
	CARDS: 'cards-storage',
	PRESI: 'presi-storage',
	CALENDAR: 'calendar-storage',
	CONTACTS: 'contacts-storage',
	STORAGE: 'storage-storage',
	MAIL: 'mail-storage',
	INVENTORY: 'inventory-storage',
	MUSIC: 'music-storage',
	PLANTA: 'planta-storage',
	PROJECTDOC: 'projectdoc-storage',
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
