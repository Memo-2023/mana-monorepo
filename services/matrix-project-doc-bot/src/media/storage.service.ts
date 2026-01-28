import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private readonly s3Client: S3Client;
	private readonly bucket: string;

	constructor(private configService: ConfigService) {
		this.s3Client = new S3Client({
			endpoint: this.configService.get<string>('s3.endpoint'),
			region: this.configService.get<string>('s3.region'),
			credentials: {
				accessKeyId: this.configService.get<string>('s3.accessKey') || '',
				secretAccessKey: this.configService.get<string>('s3.secretKey') || '',
			},
			forcePathStyle: true,
		});

		this.bucket = this.configService.get<string>('s3.bucket') || 'project-doc-bot';
	}

	async uploadFile(buffer: Buffer, contentType: string, projectId: string): Promise<string> {
		const extension = this.getExtension(contentType);
		const key = `${projectId}/${randomUUID()}${extension}`;

		await this.s3Client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: buffer,
				ContentType: contentType,
			})
		);

		this.logger.log(`Uploaded file: ${key}`);
		return key;
	}

	async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		return getSignedUrl(this.s3Client, command, { expiresIn });
	}

	async downloadFile(key: string): Promise<Buffer> {
		const response = await this.s3Client.send(
			new GetObjectCommand({
				Bucket: this.bucket,
				Key: key,
			})
		);

		const stream = response.Body as NodeJS.ReadableStream;
		const chunks: Buffer[] = [];

		for await (const chunk of stream) {
			chunks.push(Buffer.from(chunk));
		}

		return Buffer.concat(chunks);
	}

	private getExtension(contentType: string): string {
		const map: Record<string, string> = {
			'image/jpeg': '.jpg',
			'image/png': '.png',
			'image/gif': '.gif',
			'image/webp': '.webp',
			'audio/ogg': '.ogg',
			'audio/mpeg': '.mp3',
			'audio/mp4': '.m4a',
		};
		return map[contentType] || '';
	}
}
