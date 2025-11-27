import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export interface UploadResult {
	key: string;
	url: string;
}

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly publicUrl: string;

	constructor(private configService: ConfigService) {
		// Hetzner Object Storage (S3-compatible)
		const endpoint = this.configService.get<string>('S3_ENDPOINT');
		const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
		const secretAccessKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');
		const region = this.configService.get<string>('S3_REGION') || 'fsn1';
		this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'nutriphi-meals';
		this.publicUrl = this.configService.get<string>('S3_PUBLIC_URL') || '';

		if (!endpoint || !accessKeyId || !secretAccessKey) {
			this.logger.warn('S3 configuration incomplete - storage features disabled');
			this.s3Client = null as unknown as S3Client;
			return;
		}

		this.s3Client = new S3Client({
			region,
			endpoint,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
			forcePathStyle: true, // Required for Hetzner Object Storage
		});

		this.logger.log('Hetzner Object Storage initialized successfully');
	}

	private isConfigured(): boolean {
		return this.s3Client !== null;
	}

	/**
	 * Upload a file to R2 storage
	 * @param buffer - File buffer
	 * @param contentType - MIME type of the file
	 * @param folder - Optional folder path (e.g., 'meals', 'avatars')
	 * @returns Upload result with key and public URL
	 */
	async upload(buffer: Buffer, contentType: string, folder = 'meals'): Promise<UploadResult> {
		if (!this.isConfigured()) {
			throw new Error('R2 storage is not configured');
		}

		const extension = this.getExtensionFromContentType(contentType);
		const key = `${folder}/${randomUUID()}${extension}`;

		this.logger.log(`Uploading file to R2: ${key}`);

		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.bucketName,
				Key: key,
				Body: buffer,
				ContentType: contentType,
			})
		);

		const url = this.publicUrl ? `${this.publicUrl}/${key}` : await this.getSignedUrl(key);

		return { key, url };
	}

	/**
	 * Upload a base64-encoded image
	 * @param base64Data - Base64 encoded image data (with or without data URI prefix)
	 * @param folder - Optional folder path
	 * @returns Upload result with key and public URL
	 */
	async uploadBase64(base64Data: string, folder = 'meals'): Promise<UploadResult> {
		let data = base64Data;
		let contentType = 'image/jpeg';

		// Extract content type from data URI if present
		if (data.includes(',')) {
			const matches = data.match(/^data:(.+);base64,/);
			if (matches) {
				contentType = matches[1];
				data = data.split(',')[1];
			}
		}

		const buffer = Buffer.from(data, 'base64');
		return this.upload(buffer, contentType, folder);
	}

	/**
	 * Delete a file from R2 storage
	 * @param key - File key/path in the bucket
	 */
	async delete(key: string): Promise<void> {
		if (!this.isConfigured()) {
			throw new Error('R2 storage is not configured');
		}

		this.logger.log(`Deleting file from R2: ${key}`);

		await this.s3Client.send(
			new DeleteObjectCommand({
				Bucket: this.bucketName,
				Key: key,
			})
		);
	}

	/**
	 * Get a signed URL for temporary access to a file
	 * @param key - File key/path in the bucket
	 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
	 * @returns Signed URL
	 */
	async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
		if (!this.isConfigured()) {
			throw new Error('R2 storage is not configured');
		}

		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: key,
		});

		return getSignedUrl(this.s3Client, command, { expiresIn });
	}

	private getExtensionFromContentType(contentType: string): string {
		const mapping: Record<string, string> = {
			'image/jpeg': '.jpg',
			'image/jpg': '.jpg',
			'image/png': '.png',
			'image/gif': '.gif',
			'image/webp': '.webp',
			'image/heic': '.heic',
			'image/heif': '.heif',
		};
		return mapping[contentType] || '.jpg';
	}
}
