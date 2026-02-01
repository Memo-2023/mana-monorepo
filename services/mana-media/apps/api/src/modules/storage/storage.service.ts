import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

export interface StorageObject {
	key: string;
	bucket: string;
	size: number;
	contentType: string;
	etag: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
	private client: Minio.Client;
	private bucket: string;

	constructor(private config: ConfigService) {
		this.client = new Minio.Client({
			endPoint: this.config.get('S3_ENDPOINT', 'localhost'),
			port: parseInt(this.config.get('S3_PORT', '9000')),
			useSSL: this.config.get('S3_USE_SSL', 'false') === 'true',
			accessKey: this.config.get('S3_ACCESS_KEY', 'minioadmin'),
			secretKey: this.config.get('S3_SECRET_KEY', 'minioadmin'),
		});
		this.bucket = this.config.get('S3_BUCKET', 'mana-media');
	}

	async onModuleInit() {
		const exists = await this.client.bucketExists(this.bucket);
		if (!exists) {
			await this.client.makeBucket(this.bucket);
			console.log(`Created bucket: ${this.bucket}`);
		}
	}

	async upload(
		key: string,
		data: Buffer | Readable,
		contentType: string,
		metadata?: Record<string, string>
	): Promise<StorageObject> {
		const size = Buffer.isBuffer(data) ? data.length : undefined;

		await this.client.putObject(this.bucket, key, data, size, {
			'Content-Type': contentType,
			...metadata,
		});

		const stat = await this.client.statObject(this.bucket, key);

		return {
			key,
			bucket: this.bucket,
			size: stat.size,
			contentType,
			etag: stat.etag,
		};
	}

	async download(key: string): Promise<Buffer> {
		const stream = await this.client.getObject(this.bucket, key);
		const chunks: Buffer[] = [];

		return new Promise((resolve, reject) => {
			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('end', () => resolve(Buffer.concat(chunks)));
			stream.on('error', reject);
		});
	}

	async getStream(key: string): Promise<Readable> {
		return this.client.getObject(this.bucket, key);
	}

	async delete(key: string): Promise<void> {
		await this.client.removeObject(this.bucket, key);
	}

	async exists(key: string): Promise<boolean> {
		try {
			await this.client.statObject(this.bucket, key);
			return true;
		} catch {
			return false;
		}
	}

	async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
		return this.client.presignedGetObject(this.bucket, key, expiresIn);
	}

	async getUploadUrl(key: string, expiresIn = 3600): Promise<string> {
		return this.client.presignedPutObject(this.bucket, key, expiresIn);
	}

	getPublicUrl(key: string): string {
		const endpoint = this.config.get('S3_PUBLIC_URL', `http://localhost:9000/${this.bucket}`);
		return `${endpoint}/${key}`;
	}
}
