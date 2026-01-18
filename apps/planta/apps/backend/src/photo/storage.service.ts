import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createStorageClient, StorageClient } from '@manacore/shared-storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
	private storage: StorageClient;

	constructor(private configService: ConfigService) {
		const publicUrl = this.configService.get<string>('PLANTA_S3_PUBLIC_URL');
		this.storage = createStorageClient(
			{
				name: 'planta-storage',
				publicUrl,
			},
			{
				endpoint: this.configService.get<string>('S3_ENDPOINT'),
				region: this.configService.get<string>('S3_REGION'),
				accessKeyId: this.configService.get<string>('S3_ACCESS_KEY'),
				secretAccessKey: this.configService.get<string>('S3_SECRET_KEY'),
			}
		);
	}

	async uploadPhoto(
		userId: string,
		file: Express.Multer.File
	): Promise<{ storagePath: string; publicUrl: string }> {
		const extension = file.originalname.split('.').pop() || 'jpg';
		const filename = `${uuidv4()}.${extension}`;
		const storagePath = `users/${userId}/photos/${filename}`;

		await this.storage.upload(storagePath, file.buffer, {
			contentType: file.mimetype,
			public: true,
		});

		const publicUrl = this.storage.getPublicUrl(storagePath) ?? '';

		return { storagePath, publicUrl };
	}

	async deletePhoto(storagePath: string): Promise<void> {
		await this.storage.delete(storagePath);
	}

	async getPhotoUrl(storagePath: string): Promise<string> {
		return this.storage.getPublicUrl(storagePath) ?? '';
	}

	async downloadPhoto(storagePath: string): Promise<Buffer> {
		return this.storage.download(storagePath);
	}
}
