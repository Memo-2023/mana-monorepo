import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
	HeadObjectCommand,
	type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
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
	private bucket: BucketConfig;

	constructor(config: StorageConfig, bucket: BucketConfig) {
		this.client = new S3Client({
			endpoint: config.endpoint,
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
	 * Download a file from the bucket
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
		} catch {
			return false;
		}
	}

	/**
	 * List files in the bucket with optional prefix
	 */
	async list(prefix?: string, maxKeys = 1000): Promise<FileInfo[]> {
		const command = new ListObjectsV2Command({
			Bucket: this.bucket.name,
			Prefix: prefix,
			MaxKeys: maxKeys,
		});

		const response = await this.client.send(command);

		return (response.Contents ?? []).map((item) => ({
			key: item.Key!,
			size: item.Size ?? 0,
			lastModified: item.LastModified ?? new Date(),
			etag: item.ETag,
		}));
	}

	/**
	 * Generate a presigned URL for uploading (PUT)
	 */
	async getUploadUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
		const command = new PutObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		return getSignedUrl(this.client, command, {
			expiresIn: options.expiresIn ?? 3600,
		});
	}

	/**
	 * Generate a presigned URL for downloading (GET)
	 */
	async getDownloadUrl(key: string, options: PresignedUrlOptions = {}): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		return getSignedUrl(this.client, command, {
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
