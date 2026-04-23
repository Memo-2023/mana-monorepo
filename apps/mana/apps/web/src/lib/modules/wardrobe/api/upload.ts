/**
 * Client for `POST /api/v1/wardrobe/garments/upload` — the M1 endpoint
 * that wraps mana-media with `app='wardrobe'` tagging. Mirror of
 * `profile/api/me-images.ts` — same shape, different endpoint, so later
 * generalization is a rename away.
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';

export interface UploadGarmentResult {
	mediaId: string;
	storagePath: string;
	publicUrl: string;
	thumbnailUrl?: string;
}

export async function uploadGarmentPhoto(file: File): Promise<UploadGarmentResult> {
	const token = await authStore.getValidToken();
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch(`${getManaApiUrl()}/api/v1/wardrobe/garments/upload`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: formData,
	});

	if (!response.ok) {
		const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
		throw new Error(body.error || `Upload failed (${response.status})`);
	}

	return response.json() as Promise<UploadGarmentResult>;
}
