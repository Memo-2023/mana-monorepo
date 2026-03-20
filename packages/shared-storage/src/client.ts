import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	HeadObjectCommand,
	type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
	StorageConfig,
	BucketConfig,
	UploadOptions,
	PresignedUrlOptions,
	UploadResult,
	FileInfo,
} from './types';

/**
 * S3-compatible storage client for MinIO (local) and Hetzner Object Storage (production)
 */
export class StorageClient {
	private client: S3Client;
	private presignClient: S3Client;
	private bucket: BucketConfig;

	constructor(config: StorageConfig, bucket: BucketConfig) {
		// Main client for internal operations (upload, download, delete, etc.)
		this.client = new S3Client({
			endpoint: config.endpoint,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			forcePathStyle: config.forcePathStyle ?? true,
		});

		// Separate client for presigned URLs (uses public endpoint if available)
		// This allows internal operations to use Docker network addresses
		// while presigned URLs use publicly accessible endpoints
		this.presignClient = new S3Client({
			endpoint: config.publicEndpoint ?? config.endpoint,
			region: config.region,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
			forcePathStyle: config.forcePathStyle ?? true,
		});

		this.bucket = bucket;
	}

	/**
	 * Upload a file to the bucket
	 */
	async upload(
		key: string,
		body: Buffer | Uint8Array | string | ReadableStream,
		options: UploadOptions = {}
	): Promise<UploadResult> {
		const input: PutObjectCommandInput = {
			Bucket: this.bucket.name,
			Key: key,
			Body: body,
			ContentType: options.contentType,
			CacheControl: options.cacheControl,
			Metadata: options.metadata,
		};

		if (options.public) {
			input.ACL = 'public-read';
		}

		const command = new PutObjectCommand(input);
		const result = await this.client.send(command);

		return {
			key,
			url: this.getPublicUrl(key),
			etag: result.ETag,
		};
	}

	/**
	 * Upload a large file using multipart upload.
	 * Automatically splits the file into parts and uploads them in parallel.
	 * Use this for files >100MB or when uploading over unstable connections.
	 */
	async uploadMultipart(
		key: string,
		body: Buffer | Uint8Array | ReadableStream,
		options: UploadOptions = {}
	): Promise<UploadResult> {
		const upload = new Upload({
			client: this.client,
			params: {
				Bucket: this.bucket.name,
				Key: key,
				Body: body,
				ContentType: options.contentType,
				CacheControl: options.cacheControl,
				Metadata: options.metadata,
				...(options.public ? { ACL: 'public-read' as const } : {}),
			},
			queueSize: 4,
			partSize: 10 * 1024 * 1024, // 10MB parts
		});

		const result = await upload.done();

		return {
			key,
			url: this.getPublicUrl(key),
			etag: result.ETag,
		};
	}

	/**
	 * Download a file from the bucket (loads entire file into memory)
	 */
	async download(key: string): Promise<Buffer> {
		const command = new GetObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		const response = await this.client.send(command);

		if (!response.Body) {
			throw new Error(`File not found: ${key}`);
		}

		// Convert stream to buffer
		const chunks: Uint8Array[] = [];
		const stream = response.Body as AsyncIterable<Uint8Array>;
		for await (const chunk of stream) {
			chunks.push(chunk);
		}
		return Buffer.concat(chunks);
	}

	/**
	 * Download a file as a readable stream (memory-efficient for large files)
	 */
	async downloadStream(key: string): Promise<ReadableStream> {
		const command = new GetObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		const response = await this.client.send(command);

		if (!response.Body) {
			throw new Error(`File not found: ${key}`);
		}

		return response.Body.transformToWebStream();
	}

	/**
	 * Delete a file from the bucket
	 */
	async delete(key: string): Promise<void> {
		const command = new DeleteObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		await this.client.send(command);
	}

	/**
	 * Check if a file exists
	 */
	async exists(key: string): Promise<boolean> {
		try {
			const command = new HeadObjectCommand({
				Bucket: this.bucket.name,
				Key: key,
			});
			await this.client.send(command);
			return true;
		} catch (err: unknown) {
			if (err instanceof Error) {
				if (err.name === 'NotFound') return false;
				const metadata = (err as Error & { $metadata?: { httpStatusCode?: number } }).$metadata;
				if (metadata?.httpStatusCode === 404) return false;
			}
			throw err;
		}
	}

	/**
	 * List files in the bucket with optional prefix.
	 * Automatically paginates through all results if the bucket contains more than maxKeys items.
	 */
	async list(prefix?: string, maxKeys = 1000): Promise<FileInfo[]> {
		const allFiles: FileInfo[] = [];
		let continuationToken: string | undefined;

		do {
			const command = new ListObjectsV2Command({
				Bucket: this.bucket.name,
				Prefix: prefix,
				MaxKeys: maxKeys,
				ContinuationToken: continuationToken,
			});

			const response = await this.client.send(command);

			const files = (response.Contents ?? []).map((item) => ({
				key: item.Key ?? '',
				size: item.Size ?? 0,
				lastModified: item.LastModified ?? new Date(),
				etag: item.ETag,
			}));

			allFiles.push(...files);
			continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
		} while (continuationToken);

		return allFiles;
	}

	/**
	 * Generate a presigned URL for uploading (PUT)
	 * Uses the public endpoint if configured, allowing browser access
	 */
	async getUploadUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		return getSignedUrl(this.presignClient, command, {
			expiresIn: options.expiresIn ?? 3600,
		});
	}

	/**
	 * Generate a presigned URL for downloading (GET)
	 * Uses the public endpoint if configured, allowing browser access
	 */
	async getDownloadUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		return getSignedUrl(this.presignClient, command, {
			expiresIn: options.expiresIn ?? 3600,
		});
	}

	/**
	 * Get the public URL for a file (if bucket is public)
	 */
	getPublicUrl(key: string): string | undefined {
		if (!this.bucket.publicUrl) {
			return undefined;
		}
		return `${this.bucket.publicUrl}/${key}`;
	}

	/**
	 * Get the CDN URL for a file. Falls back to publicUrl if no CDN is configured.
	 */
	getCdnUrl(key: string): string | undefined {
		if (this.bucket.cdnUrl) {
			return `${this.bucket.cdnUrl}/${key}`;
		}
		return this.getPublicUrl(key);
	}

	/**
	 * Get the underlying S3 client for advanced operations
	 */
	getS3Client(): S3Client {
		return this.client;
	}

	/**
	 * Get the bucket name
	 */
	getBucketName(): string {
		return this.bucket.name;
	}
}
