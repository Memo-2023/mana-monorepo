import * as Minio from 'minio';
import { Readable } from 'stream';

export interface StorageObject {
	key: string;
	bucket: string;
	size: number;
	contentType: string;
	etag: string;
}

export class StorageService {
	private client: Minio.Client;
	private bucket: string;

	constructor() {
		this.client = new Minio.Client({
			endPoint: process.env.S3_ENDPOINT || 'localhost',
			port: parseInt(process.env.S3_PORT || '9000'),
			useSSL: process.env.S3_USE_SSL === 'true',
			accessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
			secretKey: process.env.S3_SECRET_KEY || 'minioadmin',
		});
		this.bucket = process.env.S3_BUCKET || 'mana-media';
	}

	async init() {
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

	getPublicUrl(key: string): string {
		const endpoint = process.env.S3_PUBLIC_URL || `http://localhost:9000/${this.bucket}`;
		return `${endpoint}/${key}`;
	}
}
