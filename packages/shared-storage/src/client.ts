import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	HeadObjectCommand,
	CopyObjectCommand,
	CreateMultipartUploadCommand,
	UploadPartCommand,
	CompleteMultipartUploadCommand,
	AbortMultipartUploadCommand,
	type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageHooks } from './hooks';
import type {
	StorageConfig,
	BucketConfig,
	UploadOptions,
	PresignedUrlOptions,
	MultipartUploadInit,
	MultipartUploadPart,
	UploadResult,
	FileInfo,
	FileMetadata,
} from './types';

/**
 * Wraps a ReadableStream to enforce a maximum byte size.
 * Throws if the stream exceeds the limit mid-transfer.
 */
function constrainStream(stream: ReadableStream, maxBytes: number): ReadableStream {
	const reader = stream.getReader();
	let bytesRead = 0;

	return new ReadableStream({
		async pull(controller) {
			const { done, value } = await reader.read();
			if (done) {
				controller.close();
				return;
			}
			bytesRead += value.byteLength;
			if (bytesRead > maxBytes) {
				controller.error(
					new Error(
						`Stream size ${bytesRead} bytes exceeds maximum allowed ${maxBytes} bytes`
					)
				);
				reader.cancel();
				return;
			}
			controller.enqueue(value);
		},
		cancel(reason) {
			reader.cancel(reason);
		},
	});
}

/**
 * S3-compatible storage client for MinIO (local) and Hetzner Object Storage (production)
 */
export class StorageClient {
	private client: S3Client;
	private presignClient: S3Client;
	private bucket: BucketConfig;
	readonly hooks: StorageHooks;

	constructor(config: StorageConfig, bucket: BucketConfig) {
		this.hooks = new StorageHooks();
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
		if (options.maxSizeBytes) {
			if (typeof body !== 'string' && !(body instanceof ReadableStream)) {
				if (body.byteLength > options.maxSizeBytes) {
					throw new Error(
						`File size ${body.byteLength} bytes exceeds maximum allowed ${options.maxSizeBytes} bytes`
					);
				}
			} else if (body instanceof ReadableStream) {
				body = constrainStream(body, options.maxSizeBytes);
			}
		}

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
		try {
			const result = await this.client.send(command);
			const uploadResult: UploadResult = { key, url: this.getPublicUrl(key), etag: result.ETag };
			const sizeBytes =
				typeof body !== 'string' && !(body instanceof ReadableStream) ? body.byteLength : undefined;
			this.hooks.emit('upload', {
				bucket: this.bucket.name,
				key,
				sizeBytes,
				contentType: options.contentType,
				result: uploadResult,
			});
			return uploadResult;
		} catch (err) {
			this.hooks.emit('upload:error', {
				bucket: this.bucket.name,
				key,
				error: err instanceof Error ? err : new Error(String(err)),
			});
			throw err;
		}
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
		if (options.maxSizeBytes) {
			if (!(body instanceof ReadableStream)) {
				if (body.byteLength > options.maxSizeBytes) {
					throw new Error(
						`File size ${body.byteLength} bytes exceeds maximum allowed ${options.maxSizeBytes} bytes`
					);
				}
			} else {
				body = constrainStream(body, options.maxSizeBytes);
			}
		}

		try {
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
			const uploadResult: UploadResult = { key, url: this.getPublicUrl(key), etag: result.ETag };
			const sizeBytes = !(body instanceof ReadableStream) ? body.byteLength : undefined;
			this.hooks.emit('upload', {
				bucket: this.bucket.name,
				key,
				sizeBytes,
				contentType: options.contentType,
				result: uploadResult,
			});
			return uploadResult;
		} catch (err) {
			this.hooks.emit('upload:error', {
				bucket: this.bucket.name,
				key,
				error: err instanceof Error ? err : new Error(String(err)),
			});
			throw err;
		}
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

		this.hooks.emit('download', { bucket: this.bucket.name, key });

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
		this.hooks.emit('delete', { bucket: this.bucket.name, keys: [key] });
	}

	/**
	 * Delete multiple files from the bucket in a single request.
	 * S3 supports up to 1000 keys per request; this method batches automatically.
	 */
	async deleteMany(keys: string[]): Promise<void> {
		if (keys.length === 0) return;

		const BATCH_SIZE = 1000;
		for (let i = 0; i < keys.length; i += BATCH_SIZE) {
			const batch = keys.slice(i, i + BATCH_SIZE);
			const command = new DeleteObjectsCommand({
				Bucket: this.bucket.name,
				Delete: {
					Objects: batch.map((key) => ({ Key: key })),
					Quiet: true,
				},
			});
			await this.client.send(command);
		}
		this.hooks.emit('delete', { bucket: this.bucket.name, keys });
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

	/**
	 * Delete all files matching a prefix.
	 * Useful for account deletion (e.g., deleteByPrefix('users/user-123/'))
	 */
	async deleteByPrefix(prefix: string): Promise<number> {
		const files = await this.list(prefix);
		if (files.length === 0) return 0;

		const keys = files.map((f) => f.key);
		await this.deleteMany(keys);
		return keys.length;
	}

	/**
	 * Move a file within the same bucket (copy + delete source).
	 */
	async move(sourceKey: string, destKey: string): Promise<UploadResult> {
		const result = await this.copy(sourceKey, destKey);
		await this.delete(sourceKey);
		return result;
	}

	/**
	 * Copy a file within the same bucket.
	 */
	async copy(sourceKey: string, destKey: string): Promise<UploadResult> {
		const command = new CopyObjectCommand({
			Bucket: this.bucket.name,
			CopySource: `${this.bucket.name}/${sourceKey}`,
			Key: destKey,
		});

		const result = await this.client.send(command);

		return {
			key: destKey,
			url: this.getPublicUrl(destKey),
			etag: result.CopyObjectResult?.ETag,
		};
	}

	/**
	 * Get file metadata without downloading the file.
	 */
	async getMetadata(key: string): Promise<FileMetadata> {
		const command = new HeadObjectCommand({
			Bucket: this.bucket.name,
			Key: key,
		});

		const response = await this.client.send(command);

		return {
			contentType: response.ContentType,
			size: response.ContentLength ?? 0,
			lastModified: response.LastModified,
			etag: response.ETag,
			metadata: response.Metadata,
		};
	}

	// ── Presigned Multipart Upload (browser direct-upload) ──────────────

	/**
	 * Initiate a multipart upload and return the upload ID.
	 * The browser uses this ID to upload parts directly via presigned URLs.
	 */
	async createMultipartUpload(key: string, contentType?: string): Promise<MultipartUploadInit> {
		const command = new CreateMultipartUploadCommand({
			Bucket: this.bucket.name,
			Key: key,
			ContentType: contentType,
		});

		const response = await this.client.send(command);
		if (!response.UploadId) {
			throw new Error('Failed to create multipart upload — no UploadId returned');
		}

		return { uploadId: response.UploadId, key };
	}

	/**
	 * Generate presigned URLs for each part of a multipart upload.
	 * The browser PUTs each chunk to the corresponding URL.
	 *
	 * @param key - Object key
	 * @param uploadId - From createMultipartUpload()
	 * @param parts - Number of parts to generate URLs for
	 * @param expiresIn - URL expiration in seconds (default: 3600)
	 */
	async getMultipartUploadUrls(
		key: string,
		uploadId: string,
		parts: number,
		expiresIn = 3600
	): Promise<string[]> {
		const urls: string[] = [];

		for (let partNumber = 1; partNumber <= parts; partNumber++) {
			const command = new UploadPartCommand({
				Bucket: this.bucket.name,
				Key: key,
				UploadId: uploadId,
				PartNumber: partNumber,
			});

			const url = await getSignedUrl(this.presignClient, command, { expiresIn });
			urls.push(url);
		}

		return urls;
	}

	/**
	 * Complete a multipart upload after all parts have been uploaded.
	 * The browser sends the ETag of each part (from the PUT response headers).
	 */
	async completeMultipartUpload(
		key: string,
		uploadId: string,
		parts: MultipartUploadPart[]
	): Promise<UploadResult> {
		const command = new CompleteMultipartUploadCommand({
			Bucket: this.bucket.name,
			Key: key,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: parts.map((p) => ({
					PartNumber: p.partNumber,
					ETag: p.etag,
				})),
			},
		});

		const result = await this.client.send(command);

		const uploadResult: UploadResult = {
			key,
			url: this.getPublicUrl(key),
			etag: result.ETag,
		};

		this.hooks.emit('upload', {
			bucket: this.bucket.name,
			key,
			result: uploadResult,
		});

		return uploadResult;
	}

	/**
	 * Abort a multipart upload (cleanup if the browser abandons the upload).
	 */
	async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
		const command = new AbortMultipartUploadCommand({
			Bucket: this.bucket.name,
			Key: key,
			UploadId: uploadId,
		});

		await this.client.send(command);
	}
}
