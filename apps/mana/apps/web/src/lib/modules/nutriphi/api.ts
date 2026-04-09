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
import type { NutritionData } from './types';

export interface UploadMealPhotoResult {
	mediaId: string;
	publicUrl: string;
	thumbnailUrl: string;
	storagePath: string;
}

export interface AnalyzedFood {
	name: string;
	quantity?: string;
	calories?: number;
}

export interface MealAnalysisResult {
	foods?: AnalyzedFood[];
	totalNutrition?: NutritionData;
	description?: string;
	confidence?: number;
	warnings?: string[];
	suggestions?: string[];
}

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getAccessToken();
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

	return res.json() as Promise<MealAnalysisResult>;
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

	return res.json() as Promise<MealAnalysisResult>;
}
