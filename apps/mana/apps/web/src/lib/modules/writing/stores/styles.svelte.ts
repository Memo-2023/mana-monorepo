/**
 * Writing styles store — mutation service for user-defined style records.
 *
 * Preset styles are not stored in Dexie (they live in `presets/styles.ts`)
 * unless a user explicitly "favourites" a preset — that writes a row with
 * `source='preset'` + `presetId`. Custom styles (typed description, sample-
 * trained, self-trained) are always rows.
 *
 * Sample-extraction (training) lives in M4.1 and calls into this store via
 * `upsertExtractedPrinciples`.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { writingStyleTable } from '../collections';
import { toWritingStyle } from '../queries';
import type {
	LocalWritingStyle,
	StyleSource,
	StyleSample,
	StyleExtractedPrinciples,
} from '../types';

export interface CreateStyleInput {
	name: string;
	description: string;
	source: StyleSource;
	presetId?: string | null;
	samples?: StyleSample[];
	extractedPrinciples?: StyleExtractedPrinciples | null;
	isSpaceDefault?: boolean;
	isFavorite?: boolean;
}

export type UpdateStylePatch = Partial<
	Pick<
		LocalWritingStyle,
		'name' | 'description' | 'samples' | 'extractedPrinciples' | 'isSpaceDefault' | 'isFavorite'
	>
>;

export const stylesStore = {
	async createStyle(input: CreateStyleInput) {
		const newLocal: LocalWritingStyle = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description,
			source: input.source,
			presetId: input.presetId ?? null,
			samples: input.samples ?? [],
			extractedPrinciples: input.extractedPrinciples ?? null,
			isSpaceDefault: input.isSpaceDefault ?? false,
			isFavorite: input.isFavorite ?? false,
		};
		const snapshot = toWritingStyle({ ...newLocal });
		await encryptRecord('writingStyles', newLocal);
		await writingStyleTable.add(newLocal);
		emitDomainEvent('WritingStyleCreated', 'writing', 'writingStyles', newLocal.id, {
			styleId: newLocal.id,
			source: input.source,
			name: input.name,
		});
		return snapshot;
	},

	async updateStyle(id: string, patch: UpdateStylePatch) {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('writingStyles', wrapped);
		await writingStyleTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async upsertExtractedPrinciples(id: string, principles: StyleExtractedPrinciples) {
		await stylesStore.updateStyle(id, { extractedPrinciples: principles });
		emitDomainEvent('WritingStyleTrainedFromSamples', 'writing', 'writingStyles', id, {
			styleId: id,
			toneTraitsCount: principles.toneTraits.length,
		});
	},

	async toggleFavorite(id: string) {
		const existing = await writingStyleTable.get(id);
		if (!existing) return;
		await writingStyleTable.update(id, {
			isFavorite: !existing.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async setSpaceDefault(id: string, isDefault: boolean) {
		// Only one style per space can be the default; flip the others off first.
		if (isDefault) {
			const existing = await writingStyleTable
				.filter((s) => s.isSpaceDefault && s.id !== id)
				.toArray();
			await Promise.all(
				existing.map((s) =>
					writingStyleTable.update(s.id, {
						isSpaceDefault: false,
						updatedAt: new Date().toISOString(),
					})
				)
			);
		}
		await writingStyleTable.update(id, {
			isSpaceDefault: isDefault,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteStyle(id: string) {
		const now = new Date().toISOString();
		await writingStyleTable.update(id, { deletedAt: now, updatedAt: now });
	},
};
