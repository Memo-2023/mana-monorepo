/**
 * Shared media helper — routes image uploads through mana-media
 * for CAS deduplication, thumbnail generation, and Photos gallery visibility.
 */

import { MediaClient, type MediaResult } from '@mana/media-client';

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

/**
 * Download a media file by id. The mana-media `/file` route is CDN-style
 * public — no auth on the URL itself — so this is a plain fetch. Callers
 * that need to gate on ownership MUST call `verifyMediaOwnership` first.
 */
export async function getMediaBuffer(
	mediaId: string
): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
	const url = getMediaClient().getOriginalUrl(mediaId);
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`mana-media fetch failed for ${mediaId}: HTTP ${res.status}`);
	}
	const mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
	const buffer = await res.arrayBuffer();
	return { buffer, mimeType };
}

/**
 * Verify that every id in `mediaIds` is owned by `userId` under the given
 * `app` scope. Throws { status: 404 } when one or more ids are not in the
 * user's reference set — the caller turns that into an HTTP response.
 *
 * One `list()` round-trip is all we need: the response is the full set of
 * the user's uploads under that app tag, so set-membership check is O(N)
 * in memory. The `limit: 500` cap is the sanity fence — a single user with
 * more than 500 reference images under one app is already far beyond the
 * product's intended shape; we'd catch that as a design regression long
 * before it breaks this check.
 */
export async function verifyMediaOwnership(
	userId: string,
	mediaIds: readonly string[],
	app: string
): Promise<void> {
	if (mediaIds.length === 0) return;
	const owned = await getMediaClient().list({ userId, app, limit: 500 });
	const ownedSet = new Set(owned.map((m) => m.id));
	const missing = mediaIds.filter((id) => !ownedSet.has(id));
	if (missing.length > 0) {
		const err = new Error(`Reference media not owned: ${missing.join(', ')}`) as Error & {
			status?: number;
			missing?: string[];
		};
		err.status = 404;
		err.missing = missing;
		throw err;
	}
}
