/**
 * Client-side upload helper for the website builder.
 *
 * Forwards the file to mana-media under `app=website` so uploads are
 * scoped + listable in admin. Returns `{ mediaId, url }` — the block
 * stores the full URL (simpler for the public renderer, which doesn't
 * have auth and can't re-resolve a mediaId on every render).
 *
 * The `url` is the CDN-friendly `/file/large` variant by default. If a
 * block needs a different size (gallery thumbnails), call
 * `mediaFileUrl(mediaId, variant)` with 'small' / 'medium' / 'large' /
 * 'original'.
 */

import { browser } from '$app/environment';

function getMediaUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injected = (window as unknown as { __PUBLIC_MANA_MEDIA_URL__?: string })
			.__PUBLIC_MANA_MEDIA_URL__;
		if (injected) return injected;
	}
	return (
		(import.meta as unknown as { env?: Record<string, string> }).env?.PUBLIC_MANA_MEDIA_URL ??
		process.env.PUBLIC_MANA_MEDIA_URL ??
		'http://localhost:3015'
	);
}

export type MediaVariant = 'small' | 'medium' | 'large' | 'original';

export function mediaFileUrl(mediaId: string, variant: MediaVariant = 'large'): string {
	return `${getMediaUrl()}/api/v1/media/${mediaId}/file/${variant}`;
}

export interface UploadResult {
	mediaId: string;
	url: string;
}

export class UploadError extends Error {
	readonly status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = 'UploadError';
		this.status = status;
	}
}

/**
 * Upload an image file. Throws `UploadError` on non-2xx responses or
 * non-image content. Caller is responsible for rendering the error.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
	if (!file.type.startsWith('image/')) {
		throw new UploadError('Bitte wähle ein Bild (PNG, JPG, WEBP, GIF).', 400);
	}
	if (file.size > 25 * 1024 * 1024) {
		throw new UploadError('Datei zu groß (max 25 MB).', 400);
	}

	const formData = new FormData();
	formData.append('file', file);
	formData.append('app', 'website');

	const res = await fetch(`${getMediaUrl()}/api/v1/media/upload`, {
		method: 'POST',
		body: formData,
	});
	if (!res.ok) {
		throw new UploadError(`Upload fehlgeschlagen (${res.status})`, res.status);
	}

	const data = (await res.json()) as { id?: string };
	if (!data.id) throw new UploadError('Upload-Antwort ohne Media-ID', 500);

	return { mediaId: data.id, url: mediaFileUrl(data.id, 'large') };
}
