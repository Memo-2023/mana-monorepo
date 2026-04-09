/**
 * Planta — server-only API client
 *
 * CRUD lives in IndexedDB + sync. This module talks to mana-api for the
 * two server-only operations: photo upload (S3 via mana-media) and AI
 * plant identification (Gemini Vision via mana-llm).
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
// Wire format is the single source of truth in @mana/shared-types —
// the backend validates AI responses with the same Zod schema and
// wraps them in an AiResponseEnvelope { schemaVersion, data }.
import {
	AI_SCHEMA_VERSION,
	AiSchemaVersionMismatchError,
	type AiResponseEnvelope,
	type PlantIdentification,
} from '@mana/shared-types';

export type IdentifyResult = PlantIdentification;

/** See nutriphi/api.ts for the rationale. */
function unwrapEnvelope<T>(raw: unknown): T {
	const env = raw as Partial<AiResponseEnvelope<T>> | null;
	if (!env || typeof env !== 'object' || !('schemaVersion' in env)) {
		throw new Error('AI response is not a versioned envelope');
	}
	if (env.schemaVersion !== AI_SCHEMA_VERSION) {
		throw new AiSchemaVersionMismatchError(String(env.schemaVersion));
	}
	if (env.data === undefined) {
		throw new Error('AI response envelope missing data field');
	}
	return env.data as T;
}

export interface UploadPhotoResult {
	storagePath: string;
	publicUrl: string;
	mediaId: string;
	plantId: string | null;
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

	return unwrapEnvelope<IdentifyResult>(await res.json());
}
