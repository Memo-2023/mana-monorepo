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
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import {
	uploadMealPhoto,
	analyzeMealPhoto,
	analyzeMealText,
	type MealAnalysisResult,
	type UploadMealPhotoResult,
} from './api';
import type { LocalMeal, MealType, NutritionData, AnalyzedFood } from './types';

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
	photoThumbnailUrl?: string | null;
	confidence: number;
	foods?: AnalyzedFood[] | null;
}

export interface UpdateMealDto {
	mealType?: MealType;
	description?: string;
	nutrition?: NutritionData | null;
	portionSize?: string | null;
	date?: string;
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
			photoThumbnailUrl: null,
			foods: null,
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
			photoThumbnailUrl: dto.photoThumbnailUrl ?? null,
			foods: dto.foods ?? null,
			createdAt: now,
			updatedAt: now,
		};
		const encrypted: Record<string, unknown> = { ...row };
		await encryptRecord('meals', encrypted);
		await db.table('meals').add(encrypted);
		return row;
	},

	/**
	 * Patch an existing meal. Only the provided fields are updated.
	 * Returns the decrypted snapshot after the write.
	 *
	 * Encryption note: we build a partial update object containing only
	 * the changed fields, run encryptRecord on it (mutates the encrypted
	 * fields in place), then Dexie .update() merges it into the row. The
	 * decryptRecord at the end reads back the full merged row from Dexie
	 * and decrypts it for the caller.
	 */
	async update(id: string, dto: UpdateMealDto): Promise<LocalMeal> {
		const updateData: Record<string, unknown> = {
			updatedAt: new Date().toISOString(),
		};
		if (dto.mealType !== undefined) updateData.mealType = dto.mealType;
		if (dto.description !== undefined) updateData.description = dto.description.trim();
		if (dto.nutrition !== undefined) updateData.nutrition = dto.nutrition;
		if (dto.portionSize !== undefined) updateData.portionSize = dto.portionSize;
		if (dto.date !== undefined) updateData.date = dto.date;

		await encryptRecord('meals', updateData);
		await db.table('meals').update(id, updateData);

		const updated = await db.table<LocalMeal>('meals').get(id);
		if (!updated) throw new Error('Meal disappeared after update');
		return decryptRecord('meals', { ...updated });
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
