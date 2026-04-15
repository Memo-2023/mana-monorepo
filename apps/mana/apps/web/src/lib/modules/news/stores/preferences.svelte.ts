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
import type { CustomFeed, LocalPreferences, Preferences, Topic, Language } from '../types';
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
		// Spread the input arrays — callers in onboarding pass Svelte 5
		// `$state` proxy arrays, which IndexedDB cannot structured-clone
		// (DataCloneError on the Dexie hook's _pendingChanges write).
		const diff: Partial<LocalPreferences> = {
			selectedTopics: [...input.topics],
			preferredLanguages: [...input.languages],
			blockedSources: [...(input.blockedSources ?? [])],
			onboardingCompleted: true,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	async setTopics(topics: Topic[]): Promise<void> {
		await ensureRow();
		const diff: Partial<LocalPreferences> = {
			selectedTopics: [...topics],
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	async setLanguages(languages: Language[]): Promise<void> {
		await ensureRow();
		const diff: Partial<LocalPreferences> = {
			preferredLanguages: [...languages],
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

	async pinCustomFeed(feed: { url: string; title: string; topic?: Topic }): Promise<void> {
		const row = await ensureRow();
		const existing = Array.isArray(row.customFeeds) ? row.customFeeds : [];
		if (existing.some((f) => f.url === feed.url)) return;
		const next: CustomFeed[] = [
			...existing,
			{
				id: crypto.randomUUID(),
				url: feed.url,
				title: feed.title,
				topic: feed.topic,
				pinnedAt: Date.now(),
			},
		];
		const diff: Partial<LocalPreferences> = {
			customFeeds: next,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
	},

	async unpinCustomFeed(id: string): Promise<void> {
		const row = await ensureRow();
		const existing = Array.isArray(row.customFeeds) ? row.customFeeds : [];
		const next = existing.filter((f) => f.id !== id);
		if (next.length === existing.length) return;
		const diff: Partial<LocalPreferences> = {
			customFeeds: next,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('newsPreferences', diff);
		await preferencesTable.update(PREFERENCES_ID, diff);
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
