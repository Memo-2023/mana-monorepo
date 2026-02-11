import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createFiggosStorage, type StorageClient } from '@manacore/shared-storage';

@Injectable()
export class StorageService implements OnModuleInit {
	private readonly logger = new Logger(StorageService.name);
	private storage!: StorageClient;

	constructor(private config: ConfigService) {}

	onModuleInit() {
		const publicUrl = this.config.get<string>('FIGGOS_STORAGE_PUBLIC_URL');
		this.storage = createFiggosStorage(publicUrl);
		this.logger.log('Storage initialized (bucket: figgos-storage)');
	}

	async uploadFigureImage(userId: string, figureId: string, buffer: Buffer): Promise<string> {
		const key = `${userId}/${figureId}.webp`;

		const result = await this.storage.upload(key, buffer, {
			contentType: 'image/webp',
			public: true,
		});

		const url = result.url || this.storage.getPublicUrl(key);
		this.logger.log(`Uploaded figure image: ${key}`);
		return url || key;
	}
}
