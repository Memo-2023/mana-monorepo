/**
 * Logo loader for the PDF renderer.
 *
 * Fetches the user's logo from mana-media by `mediaId`, sniffs the MIME
 * type from the response so we route to pdf-lib's `embedPng` vs
 * `embedJpg` correctly, and returns a compact { bytes, kind } tuple.
 *
 * Errors are intentionally non-throwing — a missing / broken logo
 * shouldn't prevent the invoice PDF from rendering. Caller treats the
 * null return as "skip the logo slot".
 */

import { browser } from '$app/environment';

/** Resolve the mana-media base URL the same way other modules do. */
function getMediaUrl(): string {
	if (browser) {
		const fromWindow = (window as unknown as { __PUBLIC_MANA_MEDIA_URL__?: string })
			.__PUBLIC_MANA_MEDIA_URL__;
		if (fromWindow) return fromWindow;
	}
	return import.meta.env.PUBLIC_MANA_MEDIA_URL || 'http://localhost:3015';
}

export type LogoKind = 'png' | 'jpg';

export interface LoadedLogo {
	bytes: Uint8Array;
	kind: LogoKind;
}

/**
 * Fetch the logo large variant and return the bytes + the format so the
 * renderer can pick the right pdf-lib embed function. Returns null on
 * any failure (offline, 404, unsupported format).
 */
export async function loadLogo(mediaId: string | null | undefined): Promise<LoadedLogo | null> {
	if (!mediaId) return null;
	const url = `${getMediaUrl()}/api/v1/media/${mediaId}/file/large`;
	try {
		const res = await fetch(url);
		if (!res.ok) return null;
		const contentType = res.headers.get('content-type') ?? '';
		const kind: LogoKind | null = contentType.includes('png')
			? 'png'
			: contentType.includes('jpeg') || contentType.includes('jpg')
				? 'jpg'
				: null;
		if (!kind) return null;
		const buf = await res.arrayBuffer();
		return { bytes: new Uint8Array(buf), kind };
	} catch {
		return null;
	}
}

/**
 * Upload a file to mana-media under `app=invoices` so it's scoped and
 * discoverable. Returns the new mediaId on success, or throws with a
 * user-facing message on failure (caller shows the error inline).
 *
 * Lives here rather than in a store because the upload is a one-shot
 * side effect — the setting write that follows it is the only sync-
 * tracked state change.
 */
export async function uploadLogo(file: File): Promise<string> {
	if (!file.type.startsWith('image/')) {
		throw new Error('Bitte wähle ein Bild aus (PNG oder JPG).');
	}
	const formData = new FormData();
	formData.append('file', file);
	formData.append('app', 'invoices');
	const res = await fetch(`${getMediaUrl()}/api/v1/media/upload`, {
		method: 'POST',
		body: formData,
	});
	if (!res.ok) {
		throw new Error(`Upload fehlgeschlagen (${res.status})`);
	}
	const data = (await res.json()) as { id: string };
	if (!data.id) throw new Error('Upload-Antwort ohne Media-ID.');
	return data.id;
}

/** Convenience for the UI preview. Large variant matches what the PDF uses. */
export function logoPreviewUrl(mediaId: string): string {
	return `${getMediaUrl()}/api/v1/media/${mediaId}/file/large`;
}
