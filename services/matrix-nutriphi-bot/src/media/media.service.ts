import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MediaResult {
	id: string;
	hash: string;
	url: string;
}

@Injectable()
export class MediaService implements OnModuleInit {
	private readonly logger = new Logger(MediaService.name);
	private mediaUrl: string | null = null;

	constructor(private configService: ConfigService) {}

	onModuleInit() {
		const mediaUrl = this.configService.get<string>('media.url');
		if (mediaUrl) {
			this.mediaUrl = mediaUrl;
			this.logger.log(`MediaService initialized with URL: ${mediaUrl}`);
		} else {
			this.logger.warn('MANA_MEDIA_URL not configured, media storage disabled');
		}
	}

	/**
	 * Store an image from a Matrix MXC URL in mana-media.
	 * Returns the media record if successful, null if disabled or failed.
	 */
	async storeFromMatrix(mxcUrl: string, userId: string): Promise<MediaResult | null> {
		if (!this.mediaUrl) {
			this.logger.debug('Media storage disabled, skipping storage');
			return null;
		}

		try {
			const response = await fetch(`${this.mediaUrl}/api/v1/import/matrix`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mxcUrl,
					app: 'nutriphi',
					userId,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const result = (await response.json()) as MediaResult;
			this.logger.log(`Stored media from Matrix: ${result.id} (hash: ${result.hash})`);
			return result;
		} catch (error) {
			this.logger.error(`Failed to store media from Matrix: ${error}`);
			return null;
		}
	}

	/**
	 * Check if media service is available
	 */
	isEnabled(): boolean {
		return this.mediaUrl !== null;
	}
}
