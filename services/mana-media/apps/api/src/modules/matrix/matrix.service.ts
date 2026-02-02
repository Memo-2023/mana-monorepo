import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MatrixMediaInfo {
	buffer: Buffer;
	mimeType: string;
	size: number;
	filename?: string;
}

/**
 * Service for downloading media from Matrix homeservers
 * Handles MXC URLs like mxc://matrix.mana.how/abc123
 */
@Injectable()
export class MatrixService {
	private readonly logger = new Logger(MatrixService.name);
	private readonly homeserverUrl: string;

	constructor(private config: ConfigService) {
		this.homeserverUrl = this.config.get('MATRIX_HOMESERVER_URL', 'https://matrix.mana.how');
	}

	/**
	 * Parse an MXC URL into server and media ID
	 * @param mxcUrl - URL in format mxc://server/media_id
	 */
	parseMxcUrl(mxcUrl: string): { server: string; mediaId: string } | null {
		const match = mxcUrl.match(/^mxc:\/\/([^/]+)\/(.+)$/);
		if (!match) {
			return null;
		}
		return { server: match[1], mediaId: match[2] };
	}

	/**
	 * Convert MXC URL to HTTP download URL
	 */
	getDownloadUrl(mxcUrl: string): string | null {
		const parsed = this.parseMxcUrl(mxcUrl);
		if (!parsed) {
			return null;
		}

		// Use the Matrix Content Repository API
		// Format: /_matrix/media/v3/download/{serverName}/{mediaId}
		return `${this.homeserverUrl}/_matrix/media/v3/download/${parsed.server}/${parsed.mediaId}`;
	}

	/**
	 * Download media from a Matrix MXC URL
	 */
	async downloadFromMxc(mxcUrl: string): Promise<MatrixMediaInfo | null> {
		const downloadUrl = this.getDownloadUrl(mxcUrl);
		if (!downloadUrl) {
			this.logger.error(`Invalid MXC URL: ${mxcUrl}`);
			return null;
		}

		try {
			this.logger.debug(`Downloading from Matrix: ${downloadUrl}`);

			const response = await fetch(downloadUrl);

			if (!response.ok) {
				this.logger.error(
					`Failed to download from Matrix: ${response.status} ${response.statusText}`
				);
				return null;
			}

			const contentType = response.headers.get('content-type') || 'application/octet-stream';
			const contentDisposition = response.headers.get('content-disposition');

			// Extract filename from Content-Disposition if available
			let filename: string | undefined;
			if (contentDisposition) {
				const match = contentDisposition.match(
					/filename[*]?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i
				);
				if (match) {
					filename = decodeURIComponent(match[1]);
				}
			}

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			return {
				buffer,
				mimeType: contentType,
				size: buffer.length,
				filename,
			};
		} catch (error) {
			this.logger.error(`Error downloading from Matrix: ${error}`);
			return null;
		}
	}

	/**
	 * Download a thumbnail from Matrix
	 * Matrix can generate thumbnails on-the-fly with specified dimensions
	 */
	async downloadThumbnailFromMxc(
		mxcUrl: string,
		options?: {
			width?: number;
			height?: number;
			method?: 'crop' | 'scale';
		}
	): Promise<MatrixMediaInfo | null> {
		const parsed = this.parseMxcUrl(mxcUrl);
		if (!parsed) {
			this.logger.error(`Invalid MXC URL: ${mxcUrl}`);
			return null;
		}

		const width = options?.width || 320;
		const height = options?.height || 240;
		const method = options?.method || 'scale';

		// Use the Matrix thumbnail API
		// Format: /_matrix/media/v3/thumbnail/{serverName}/{mediaId}?width=X&height=Y&method=crop|scale
		const thumbnailUrl = `${this.homeserverUrl}/_matrix/media/v3/thumbnail/${parsed.server}/${parsed.mediaId}?width=${width}&height=${height}&method=${method}`;

		try {
			this.logger.debug(`Downloading thumbnail from Matrix: ${thumbnailUrl}`);

			const response = await fetch(thumbnailUrl);

			if (!response.ok) {
				this.logger.warn(
					`Failed to get thumbnail from Matrix: ${response.status}, falling back to full download`
				);
				return this.downloadFromMxc(mxcUrl);
			}

			const contentType = response.headers.get('content-type') || 'image/png';
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			return {
				buffer,
				mimeType: contentType,
				size: buffer.length,
			};
		} catch (error) {
			this.logger.error(`Error downloading thumbnail from Matrix: ${error}`);
			return null;
		}
	}

	/**
	 * Check if a URL is a valid MXC URL
	 */
	isValidMxcUrl(url: string): boolean {
		return this.parseMxcUrl(url) !== null;
	}
}
