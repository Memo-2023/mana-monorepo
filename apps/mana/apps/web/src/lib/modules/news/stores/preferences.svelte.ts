/**
 * Preferences store — singleton row keyed on `PREFERENCES_ID`.
 *
 * The first read of the preferences row is also the place that creates
 * it on disk, so the rest of the codebase can assume it always exists.
 * Onboarding then flips `onboardingCompleted` to true.
 */

import { encryptRecord } from '$lib/data/crypto';
import { preferencesTable, DEFAULT_PREFERENCES } from '../collections';
import { toPreferences } from '../queries';
import type { LocalPreferences, Preferences, Topic, Language } from '../types';
import { PREFERENCES_ID } from '../types';

async function ensureRow(): Promise<LocalPreferences> {
	const existing = await preferencesTable.get(PREFERENCES_ID);
	if (existing) return existing;
	const fresh: LocalPreferences = { ...DEFAULT_PREFERENCES };
	await encryptRecord('newsPreferences', fresh);
	await preferencesTable.add(fresh);
	return fresh;
}

export const preferencesStore = {
	async get(): Promise<Preferences> {
		const row = await ensureRow();
		return toPreferences(row);
	},

	async completeOnboarding(input: {
		topics: Topic[];
		languages: Language[];
		blockedSources?: string[];
	}): Promise<void> {
		await ensureRow();
		const diff: Partial<LocalPreferences> = {
			selectedTopics: input.topics,
			preferredLanguages: input.languages,
			blockedSources: input.blockedSources ?? [],
			onboardingCompleted: true,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	async setTopics(topics: Topic[]): Promise<void> {
		await ensureRow();
		const diff: Partial<LocalPreferences> = {
			selectedTopics: topics,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	async setLanguages(languages: Language[]): Promise<void> {
		await ensureRow();
		const diff: Partial<LocalPreferences> = {
			preferredLanguages: languages,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	async toggleBlockedSource(slug: string): Promise<void> {
		const row = await ensureRow();
		const blocked = row.blockedSources ?? [];
		const next = blocked.includes(slug) ? blocked.filter((s) => s !== slug) : [...blocked, slug];
		const diff: Partial<LocalPreferences> = {
			blockedSources: next,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	/**
	 * Apply a precomputed weight diff (from feed-engine.applyReaction).
	 * Merges with existing weights — caller already did the math.
	 */
	async applyWeightDiff(diff: {
		topicWeights?: Record<string, number>;
		sourceWeights?: Record<string, number>;
		blockedSources?: string[];
	}): Promise<void> {
		await ensureRow();
		const update: Partial<LocalPreferences> = {
			...diff,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', update);
		await preferencesTable.update(PREFERENCES_ID, update);
	},

	async resetWeights(): Promise<void> {
		await ensureRow();
		const diff: Partial<LocalPreferences> = {
			topicWeights: {},
			sourceWeights: {},
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},
};
