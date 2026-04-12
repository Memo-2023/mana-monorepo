/**
 * NutriPhi — server-only API client
 *
 * CRUD lives in IndexedDB + sync. This module talks to mana-api for the
 * three server-only operations: photo upload (S3 via mana-media), AI
 * meal analysis from a photo URL (Gemini Vision via mana-llm), and
 * AI meal analysis from a text description.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
// Wire format is the single source of truth in @mana/shared-types —
// the backend validates AI responses with these same Zod schemas and
// wraps them in an AiResponseEnvelope { schemaVersion, data }.
import {
	AI_SCHEMA_VERSION,
	AiSchemaVersionMismatchError,
	type AiResponseEnvelope,
	type MealAnalysis,
} from '@mana/shared-types';

export type MealAnalysisResult = MealAnalysis;

/**
 * Decode an AI response envelope, asserting the schema version matches
 * the one this client was compiled against. Throws if the server is on
 * a different version (clears confusing "field is undefined" bugs in
 * the wild — instead you get an actionable error in the network panel).
 */
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

export interface UploadMealPhotoResult {
	mediaId: string;
	publicUrl: string;
	thumbnailUrl: string;
	storagePath: string;
}

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Upload a meal photo to mana-api → S3 (mana-media). */
export async function uploadMealPhoto(file: File): Promise<UploadMealPhotoResult> {
	const formData = new FormData();
	formData.append('file', file);

	const res = await fetch(`${getManaApiUrl()}/api/v1/nutriphi/photos/upload`, {
		method: 'POST',
		headers: await authHeader(),
		body: formData,
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Upload failed (${res.status}): ${body || res.statusText}`);
	}

	return res.json() as Promise<UploadMealPhotoResult>;
}

/** Run Gemini Vision analysis on a previously uploaded photo URL. */
export async function analyzeMealPhoto(photoUrl: string): Promise<MealAnalysisResult> {
	const res = await fetch(`${getManaApiUrl()}/api/v1/nutriphi/analysis/photo`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(await authHeader()),
		},
		body: JSON.stringify({ photoUrl }),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Analysis failed (${res.status}): ${body || res.statusText}`);
	}

	return unwrapEnvelope<MealAnalysisResult>(await res.json());
}

/** Run Gemini analysis on a free-text meal description. */
export async function analyzeMealText(description: string): Promise<MealAnalysisResult> {
	const res = await fetch(`${getManaApiUrl()}/api/v1/nutriphi/analysis/text`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(await authHeader()),
		},
		body: JSON.stringify({ description }),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`Analysis failed (${res.status}): ${body || res.statusText}`);
	}

	return unwrapEnvelope<MealAnalysisResult>(await res.json());
}
