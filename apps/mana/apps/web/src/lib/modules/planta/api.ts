/**
 * Planta — server-only API client
 *
 * CRUD lives in IndexedDB + sync. This module talks to mana-api for the
 * two server-only operations: photo upload (S3 via mana-media) and AI
 * plant identification (Gemini Vision via mana-llm).
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';

export interface UploadPhotoResult {
	storagePath: string;
	publicUrl: string;
	mediaId: string;
	plantId: string | null;
}

export interface IdentifyResult {
	scientificName?: string;
	commonNames?: string[];
	confidence?: number;
	healthAssessment?: string;
	wateringAdvice?: string;
	lightAdvice?: string;
	generalTips?: string[];
}

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getAccessToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Upload a photo file to mana-api → S3 (mana-media). */
export async function uploadPlantPhoto(file: File, plantId: string): Promise<UploadPhotoResult> {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('plantId', plantId);

	const res = await fetch(`${getManaApiUrl()}/api/v1/planta/photos/upload`, {
		method: 'POST',
		headers: await authHeader(),
		body: formData,
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Upload failed (${res.status}): ${body || res.statusText}`);
	}

	return res.json() as Promise<UploadPhotoResult>;
}

/** Run AI identification on a previously uploaded photo URL. */
export async function identifyPlant(photoUrl: string): Promise<IdentifyResult> {
	const res = await fetch(`${getManaApiUrl()}/api/v1/planta/analysis/identify`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(await authHeader()),
		},
		body: JSON.stringify({ photoUrl }),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Identify failed (${res.status}): ${body || res.statusText}`);
	}

	return res.json() as Promise<IdentifyResult>;
}
