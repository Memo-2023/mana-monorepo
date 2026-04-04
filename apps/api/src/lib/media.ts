/**
 * Shared media helper — routes image uploads through mana-media
 * for CAS deduplication, thumbnail generation, and Photos gallery visibility.
 */

import { MediaClient, type MediaResult } from '@manacore/media-client';

const MEDIA_URL = process.env.MANA_MEDIA_URL || 'http://localhost:3015';
let client: MediaClient | null = null;

function getMediaClient(): MediaClient {
	if (!client) client = new MediaClient(MEDIA_URL);
	return client;
}

export async function uploadImageToMedia(
	buffer: ArrayBuffer,
	filename: string,
	options: { app: string; userId: string }
): Promise<MediaResult> {
	return getMediaClient().upload(buffer, {
		app: options.app,
		userId: options.userId,
		filename,
	});
}

export function getMediaUrls(mediaId: string) {
	const c = getMediaClient();
	return {
		original: c.getOriginalUrl(mediaId),
		thumbnail: c.getThumbnailUrl(mediaId),
		medium: c.getMediumUrl(mediaId),
		large: c.getLargeUrl(mediaId),
	};
}

export function isImageMimeType(mimeType: string): boolean {
	return mimeType.startsWith('image/') && mimeType !== 'image/svg+xml';
}
