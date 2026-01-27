import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	HeadBucketCommand,
	CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService implements OnModuleInit {
	private readonly logger = new Logger(StorageService.name);
	private readonly s3: S3Client;
	private readonly bucket: string;

	constructor(private configService: ConfigService) {
		this.bucket = this.configService.get<string>('s3.bucket')!;

		this.s3 = new S3Client({
			endpoint: this.configService.get<string>('s3.endpoint'),
			region: this.configService.get<string>('s3.region'),
			credentials: {
				accessKeyId: this.configService.get<string>('s3.accessKey')!,
				secretAccessKey: this.configService.get<string>('s3.secretKey')!,
			},
			forcePathStyle: true, // Required for MinIO
		});
	}

	async onModuleInit() {
		await this.ensureBucket();
	}

	private async ensureBucket(): Promise<void> {
		try {
			await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
			this.logger.log(`Bucket "${this.bucket}" exists`);
		} catch (error: unknown) {
			if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
				this.logger.log(`Creating bucket "${this.bucket}"...`);
				await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
				this.logger.log(`Bucket "${this.bucket}" created`);
			} else {
				this.logger.warn(`Could not check bucket: ${error}`);
			}
		}
	}

	async upload(key: string, buffer: Buffer, contentType: string): Promise<string> {
		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: buffer,
				ContentType: contentType,
			})
		);

		this.logger.debug(`Uploaded ${key} (${buffer.length} bytes)`);
		return key;
	}

	async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});

		return getSignedUrl(this.s3, command, { expiresIn });
	}

	generateKey(projectId: string, type: 'photo' | 'voice' | 'pdf', filename: string): string {
		return `${projectId}/${type}/${filename}`;
	}
}
