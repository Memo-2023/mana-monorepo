/**
 * Client for `POST /api/v1/profile/me-images/upload` — the M1 endpoint
 * that wraps mana-media (CAS dedup + thumbnails) with auth.
 *
 * Returns what the Dexie row needs: mediaId, storagePath, publicUrl,
 * thumbnailUrl. Dimensions are read client-side so the call site can
 * stamp width/height on the LocalMeImage without waiting for
 * mana-media's async processing pass.
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';

export interface UploadMeImageResult {
	mediaId: string;
	storagePath: string;
	publicUrl: string;
	thumbnailUrl?: string;
}

export async function uploadMeImageFile(file: File): Promise<UploadMeImageResult> {
	const token = await authStore.getValidToken();
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`${getManaApiUrl()}/api/v1/profile/me-images/upload`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData,
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
		throw new Error(body.error || `Upload failed (${response.status})`);
	}

	return response.json() as Promise<UploadMeImageResult>;
}

/**
 * Read the natural dimensions of an image file client-side. mana-media
 * also reports dimensions post-processing, but we want them synchronously
 * so the Dexie row lands with `width` and `height` populated on first
 * write — that lets the UI pick the right aspect-ratio tile immediately
 * instead of re-flowing once the server catches up.
 */
export function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve({ width: img.naturalWidth, height: img.naturalHeight });
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};
		img.src = url;
	});
}
