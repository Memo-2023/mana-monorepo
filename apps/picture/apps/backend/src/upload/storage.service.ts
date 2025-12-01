import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as path from 'path';

export type StorageMode = 'local' | 's3';

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private mode: StorageMode;
	private s3Client: S3Client | null = null;
	private readonly bucket: string;
	private readonly localStoragePath: string;
	private readonly publicUrlBase: string;

	constructor(private configService: ConfigService) {
		// Determine storage mode from environment
		const storageMode = this.configService.get<string>('STORAGE_MODE', 'local');
		this.mode = storageMode === 's3' ? 's3' : 'local';

		// S3 configuration (Hetzner Object Storage is S3-compatible)
		const s3Endpoint = this.configService.get<string>('S3_ENDPOINT');
		const s3Region = this.configService.get<string>('S3_REGION', 'eu-central-1');
		const s3AccessKey = this.configService.get<string>('S3_ACCESS_KEY');
		const s3SecretKey = this.configService.get<string>('S3_SECRET_KEY');
		this.bucket = this.configService.get<string>('S3_BUCKET', 'picture-uploads');

		// Local storage configuration
		this.localStoragePath = this.configService.get<string>(
			'LOCAL_STORAGE_PATH',
			path.join(process.cwd(), 'uploads')
		);

		// Public URL base for serving files
		const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3003');
		this.publicUrlBase = this.configService.get<string>(
			'STORAGE_PUBLIC_URL',
			this.mode === 'local' ? `${backendUrl}/uploads` : `https://${this.bucket}.${s3Endpoint}`
		);

		if (this.mode === 's3') {
			if (s3Endpoint && s3AccessKey && s3SecretKey) {
				this.s3Client = new S3Client({
					endpoint: s3Endpoint.startsWith('http') ? s3Endpoint : `https://${s3Endpoint}`,
					region: s3Region,
					credentials: {
						accessKeyId: s3AccessKey,
						secretAccessKey: s3SecretKey,
					},
					forcePathStyle: false, // Hetzner uses virtual-hosted style
				});
				this.logger.log(`Storage initialized in S3 mode (endpoint: ${s3Endpoint})`);
			} else {
				this.logger.warn('S3 credentials not configured, falling back to local storage');
				this.mode = 'local';
			}
		}

		if (this.mode === 'local') {
			this.logger.log(`Storage initialized in local mode (path: ${this.localStoragePath})`);
			this.ensureLocalStorageDirectory();
		}
	}

	private async ensureLocalStorageDirectory(): Promise<void> {
		try {
			await fs.mkdir(this.localStoragePath, { recursive: true });
		} catch (error) {
			this.logger.error('Failed to create local storage directory', error);
		}
	}

	async uploadFile(
		buffer: Buffer,
		userId: string,
		filename: string,
		contentType: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(2, 10);
		const ext = filename.split('.').pop() || 'jpg';
		const storagePath = `${userId}/${timestamp}-${randomId}.${ext}`;

		if (this.mode === 's3' && this.s3Client) {
			return this.uploadToS3(buffer, storagePath, contentType);
		} else {
			return this.uploadToLocal(buffer, storagePath);
		}
	}

	private async uploadToS3(
		buffer: Buffer,
		storagePath: string,
		contentType: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		if (!this.s3Client) {
			throw new Error('S3 client not configured');
		}

		const command = new PutObjectCommand({
			Bucket: this.bucket,
			Key: storagePath,
			Body: buffer,
			ContentType: contentType,
			ACL: 'public-read',
		});

		try {
			await this.s3Client.send(command);
			const publicUrl = `${this.publicUrlBase}/${storagePath}`;

			return { storagePath, publicUrl };
		} catch (error) {
			this.logger.error('Error uploading file to S3', error);
			throw error;
		}
	}

	private async uploadToLocal(
		buffer: Buffer,
		storagePath: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		const fullPath = path.join(this.localStoragePath, storagePath);
		const directory = path.dirname(fullPath);

		try {
			await fs.mkdir(directory, { recursive: true });
			await fs.writeFile(fullPath, buffer);

			const publicUrl = `${this.publicUrlBase}/${storagePath}`;

			return { storagePath, publicUrl };
		} catch (error) {
			this.logger.error('Error uploading file to local storage', error);
			throw error;
		}
	}

	async uploadFromUrl(
		url: string,
		userId: string,
		filename: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		// Download the file
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download file from ${url}`);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		const contentType = response.headers.get('content-type') || 'image/jpeg';

		return this.uploadFile(buffer, userId, filename, contentType);
	}

	async deleteFile(storagePath: string): Promise<void> {
		if (this.mode === 's3' && this.s3Client) {
			return this.deleteFromS3(storagePath);
		} else {
			return this.deleteFromLocal(storagePath);
		}
	}

	private async deleteFromS3(storagePath: string): Promise<void> {
		if (!this.s3Client) {
			throw new Error('S3 client not configured');
		}

		const command = new DeleteObjectCommand({
			Bucket: this.bucket,
			Key: storagePath,
		});

		try {
			await this.s3Client.send(command);
		} catch (error) {
			this.logger.error(`Error deleting file ${storagePath} from S3`, error);
			throw error;
		}
	}

	private async deleteFromLocal(storagePath: string): Promise<void> {
		const fullPath = path.join(this.localStoragePath, storagePath);

		try {
			await fs.unlink(fullPath);
		} catch (error) {
			// Ignore if file doesn't exist
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				this.logger.error(`Error deleting file ${storagePath} from local storage`, error);
				throw error;
			}
		}
	}

	async uploadBoardThumbnail(boardId: string, dataUrl: string): Promise<string> {
		const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
		const buffer = Buffer.from(base64Data, 'base64');
		const storagePath = `boards/${boardId}/thumbnail-${Date.now()}.png`;

		if (this.mode === 's3' && this.s3Client) {
			const result = await this.uploadToS3(buffer, storagePath, 'image/png');
			return result.publicUrl;
		} else {
			const result = await this.uploadToLocal(buffer, storagePath);
			return result.publicUrl;
		}
	}

	async getFile(storagePath: string): Promise<Buffer | null> {
		if (this.mode === 's3' && this.s3Client) {
			return this.getFromS3(storagePath);
		} else {
			return this.getFromLocal(storagePath);
		}
	}

	private async getFromS3(storagePath: string): Promise<Buffer | null> {
		if (!this.s3Client) {
			throw new Error('S3 client not configured');
		}

		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: storagePath,
		});

		try {
			const response = await this.s3Client.send(command);
			if (response.Body) {
				const byteArray = await response.Body.transformToByteArray();
				return Buffer.from(byteArray);
			}
			return null;
		} catch (error) {
			this.logger.error(`Error getting file ${storagePath} from S3`, error);
			return null;
		}
	}

	private async getFromLocal(storagePath: string): Promise<Buffer | null> {
		const fullPath = path.join(this.localStoragePath, storagePath);

		try {
			return await fs.readFile(fullPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return null;
			}
			this.logger.error(`Error getting file ${storagePath} from local storage`, error);
			return null;
		}
	}

	getStorageMode(): StorageMode {
		return this.mode;
	}

	getPublicUrl(storagePath: string): string {
		return `${this.publicUrlBase}/${storagePath}`;
	}
}
