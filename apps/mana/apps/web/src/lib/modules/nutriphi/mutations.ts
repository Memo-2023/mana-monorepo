/**
 * NutriPhi — Mutation Helpers (Local-First)
 *
 * All writes go to IndexedDB first, sync handles the rest. Mutations throw
 * on failure so UI callers can surface errors via toasts. Server-only
 * operations (photo upload, AI analysis) live in ./api.
 *
 * Encryption pattern: build the LocalMeal as plaintext, shallow-clone it,
 * run encryptRecord on the clone (mutates only the allow-listed fields —
 * see crypto/registry.ts), then write the clone to Dexie. The original
 * plaintext object is returned to the caller. nutrition / photoMediaId /
 * photoUrl / confidence are NOT encrypted by design (see registry comment).
 */

import { db } from '$lib/data/database';
import { encryptRecord } from '$lib/data/crypto';
import {
	uploadMealPhoto,
	analyzeMealPhoto,
	analyzeMealText,
	type MealAnalysisResult,
	type UploadMealPhotoResult,
} from './api';
import type { LocalMeal, MealType, NutritionData } from './types';

export interface CreateMealDto {
	mealType: MealType;
	description: string;
	nutrition?: NutritionData | null;
	portionSize?: string | null;
	date?: string; // YYYY-MM-DD, defaults to today
}

export interface CreateMealFromPhotoDto extends CreateMealDto {
	photoMediaId: string;
	photoUrl: string;
	confidence: number;
}

function todayStr(): string {
	return new Date().toISOString().split('T')[0];
}

export const mealMutations = {
	/** Persist a text-only meal entry. */
	async create(dto: CreateMealDto): Promise<LocalMeal> {
		const now = new Date().toISOString();
		const row: LocalMeal = {
			id: crypto.randomUUID(),
			date: dto.date ?? todayStr(),
			mealType: dto.mealType,
			inputType: 'text',
			description: dto.description.trim(),
			portionSize: dto.portionSize ?? null,
			confidence: dto.nutrition ? 0.8 : 0,
			nutrition: dto.nutrition ?? null,
			photoMediaId: null,
			photoUrl: null,
			createdAt: now,
			updatedAt: now,
		};
		const encrypted: Record<string, unknown> = { ...row };
		await encryptRecord('meals', encrypted);
		await db.table('meals').add(encrypted);
		return row;
	},

	/** Persist a meal entry that originated from a photo + AI analysis. */
	async createFromPhoto(dto: CreateMealFromPhotoDto): Promise<LocalMeal> {
		const now = new Date().toISOString();
		const row: LocalMeal = {
			id: crypto.randomUUID(),
			date: dto.date ?? todayStr(),
			mealType: dto.mealType,
			inputType: 'photo',
			description: dto.description.trim(),
			portionSize: dto.portionSize ?? null,
			confidence: dto.confidence,
			nutrition: dto.nutrition ?? null,
			photoMediaId: dto.photoMediaId,
			photoUrl: dto.photoUrl,
			createdAt: now,
			updatedAt: now,
		};
		const encrypted: Record<string, unknown> = { ...row };
		await encryptRecord('meals', encrypted);
		await db.table('meals').add(encrypted);
		return row;
	},

	async delete(id: string): Promise<void> {
		const now = new Date().toISOString();
		await db.table('meals').update(id, { deletedAt: now, updatedAt: now });
	},
};

export interface PhotoAnalysisOutcome {
	upload: UploadMealPhotoResult;
	analysis: MealAnalysisResult;
}

export const photoMutations = {
	/**
	 * Upload a meal photo to mana-media and immediately run AI analysis on it.
	 * Does NOT persist a meal — the caller (usually the add page) shows the
	 * result to the user for review and then calls mealMutations.createFromPhoto.
	 */
	async uploadAndAnalyze(file: File): Promise<PhotoAnalysisOutcome> {
		const upload = await uploadMealPhoto(file);
		const analysis = await analyzeMealPhoto(upload.publicUrl);
		return { upload, analysis };
	},

	/** Just upload a photo, no analysis. Useful when re-running analysis later. */
	async upload(file: File): Promise<UploadMealPhotoResult> {
		return uploadMealPhoto(file);
	},

	/** Re-run analysis on an already-uploaded photo URL. */
	async analyze(photoUrl: string): Promise<MealAnalysisResult> {
		return analyzeMealPhoto(photoUrl);
	},
};

export const textAnalysisMutations = {
	/** Run Gemini analysis on a free-text meal description (no persistence). */
	async analyze(description: string): Promise<MealAnalysisResult> {
		return analyzeMealText(description);
	},
};
