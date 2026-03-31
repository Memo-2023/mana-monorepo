/**
 * Guides store — mutation layer for guides, sections, steps, and collections.
 * Reads happen via Dexie liveQuery in components.
 */

import type { BaseRecord } from '@manacore/local-store';
import {
	guideCollection,
	sectionCollection,
	stepCollection,
	collectionCollection,
	type LocalGuide,
	type LocalSection,
	type LocalStep,
	type LocalCollection,
} from '$lib/data/local-store.js';

// ─── Error state ─────────────────────────────────────────────

let error = $state<string | null>(null);

async function withErrorHandling<T>(fn: () => Promise<T>, msg: string): Promise<T | null> {
	try {
		return await fn();
	} catch (e) {
		error = msg;
		console.error(msg, e);
		return null;
	}
}

// ─── Guides ──────────────────────────────────────────────────

export const guidesStore = {
	get error() {
		return error;
	},
	clearError() {
		error = null;
	},

	async createGuide(
		data: Omit<LocalGuide, keyof BaseRecord>
	): Promise<LocalGuide | null> {
		return withErrorHandling(async () => {
			return guideCollection.insert({
				id: crypto.randomUUID(),
				...data,
				tags: data.tags ?? [],
			});
		}, 'Guide konnte nicht erstellt werden');
	},

	async updateGuide(id: string, data: Partial<LocalGuide>): Promise<LocalGuide | null> {
		return withErrorHandling(
			() => guideCollection.update(id, data),
			'Guide konnte nicht aktualisiert werden'
		);
	},

	async deleteGuide(id: string): Promise<void> {
		await withErrorHandling(async () => {
			// Soft-delete guide + cascade to sections/steps
			await guideCollection.delete(id);
			const sections = await sectionCollection.getAll({ guideId: id });
			for (const s of sections) await sectionCollection.delete(s.id);
			const steps = await stepCollection.getAll({ guideId: id });
			for (const s of steps) await stepCollection.delete(s.id);
		}, 'Guide konnte nicht gelöscht werden');
	},

	// ─── Sections ──────────────────────────────────────────

	async createSection(data: Omit<LocalSection, keyof BaseRecord>): Promise<LocalSection | null> {
		return withErrorHandling(
			() => sectionCollection.insert({ id: crypto.randomUUID(), ...data }),
			'Abschnitt konnte nicht erstellt werden'
		);
	},

	async updateSection(id: string, data: Partial<LocalSection>): Promise<LocalSection | null> {
		return withErrorHandling(
			() => sectionCollection.update(id, data),
			'Abschnitt konnte nicht aktualisiert werden'
		);
	},

	async deleteSection(id: string): Promise<void> {
		await withErrorHandling(async () => {
			await sectionCollection.delete(id);
			const steps = await stepCollection.getAll({ sectionId: id });
			for (const s of steps) await stepCollection.delete(s.id);
		}, 'Abschnitt konnte nicht gelöscht werden');
	},

	// ─── Steps ─────────────────────────────────────────────

	async createStep(data: Omit<LocalStep, keyof BaseRecord>): Promise<LocalStep | null> {
		return withErrorHandling(
			() => stepCollection.insert({ id: crypto.randomUUID(), ...data }),
			'Schritt konnte nicht erstellt werden'
		);
	},

	async updateStep(id: string, data: Partial<LocalStep>): Promise<LocalStep | null> {
		return withErrorHandling(
			() => stepCollection.update(id, data),
			'Schritt konnte nicht aktualisiert werden'
		);
	},

	async deleteStep(id: string): Promise<void> {
		await withErrorHandling(
			() => stepCollection.delete(id),
			'Schritt konnte nicht gelöscht werden'
		);
	},

	// ─── Collections ───────────────────────────────────────

	async createCollection(
		data: Omit<LocalCollection, keyof BaseRecord>
	): Promise<LocalCollection | null> {
		return withErrorHandling(
			() => collectionCollection.insert({ id: crypto.randomUUID(), ...data }),
			'Sammlung konnte nicht erstellt werden'
		);
	},

	async updateCollection(id: string, data: Partial<LocalCollection>): Promise<LocalCollection | null> {
		return withErrorHandling(
			() => collectionCollection.update(id, data),
			'Sammlung konnte nicht aktualisiert werden'
		);
	},
};
