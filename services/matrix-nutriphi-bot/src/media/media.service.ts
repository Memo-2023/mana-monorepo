import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaClient, MediaResult } from '@manacore/media-client';

@Injectable()
export class MediaService implements OnModuleInit {
	private readonly logger = new Logger(MediaService.name);
	private client: MediaClient | null = null;

	constructor(private configService: ConfigService) {}

	onModuleInit() {
		const mediaUrl = this.configService.get<string>('media.url');
		if (mediaUrl) {
			this.client = new MediaClient(mediaUrl);
			this.logger.log(`MediaClient initialized with URL: ${mediaUrl}`);
		} else {
			this.logger.warn('MANA_MEDIA_URL not configured, media storage disabled');
		}
	}

	/**
	 * Store an image from a Matrix MXC URL in mana-media.
	 * Returns the media record if successful, null if disabled or failed.
	 */
	async storeFromMatrix(mxcUrl: string, userId: string): Promise<MediaResult | null> {
		if (!this.client) {
			this.logger.debug('Media storage disabled, skipping storage');
			return null;
		}

		try {
			const result = await this.client.importFromMatrix({
				mxcUrl,
				app: 'nutriphi',
				userId,
			});

			this.logger.log(`Stored media from Matrix: ${result.id} (hash: ${result.hash})`);
			return result;
		} catch (error) {
			this.logger.error(`Failed to store media from Matrix: ${error}`);
			return null;
		}
	}

	/**
	 * Check if a file already exists by hash
	 */
	async checkExists(hash: string): Promise<MediaResult | null> {
		if (!this.client) {
			return null;
		}

		try {
			return await this.client.getByHash(hash);
		} catch {
			return null;
		}
	}

	/**
	 * Get media by ID
	 */
	async get(id: string): Promise<MediaResult | null> {
		if (!this.client) {
			return null;
		}

		try {
			return await this.client.get(id);
		} catch {
			return null;
		}
	}

	/**
	 * Check if media service is available
	 */
	isEnabled(): boolean {
		return this.client !== null;
	}
}
