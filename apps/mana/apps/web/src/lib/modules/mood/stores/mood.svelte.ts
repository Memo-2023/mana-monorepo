/**
 * Mood Store — mutation-only service.
 */

import { encryptRecord } from '$lib/data/crypto';
import { moodEntryTable, moodSettingsTable } from '../collections';
import { toMoodEntry } from '../queries';
import type { LocalMoodEntry, LocalMoodSettings, CoreEmotion, ActivityContext } from '../types';
import { DEFAULT_MOOD_SETTINGS } from '../types';

export const moodStore = {
	async logMood(input: {
		level: number;
		emotion: CoreEmotion;
		secondaryEmotions?: CoreEmotion[];
		activity?: ActivityContext | null;
		withWhom?: string;
		notes?: string;
		tags?: string[];
	}) {
		const now = new Date();
		const newLocal: LocalMoodEntry = {
			id: crypto.randomUUID(),
			date: now.toISOString().split('T')[0],
			time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
			level: input.level,
			emotion: input.emotion,
			secondaryEmotions: input.secondaryEmotions ?? [],
			activity: input.activity ?? null,
			withWhom: input.withWhom ?? '',
			notes: input.notes ?? '',
			tags: input.tags ?? [],
		};
		const snapshot = toMoodEntry({ ...newLocal });
		await encryptRecord('moodEntries', newLocal);
		await moodEntryTable.add(newLocal);
		return snapshot;
	},

	async updateEntry(
		id: string,
		patch: Partial<
			Pick<
				LocalMoodEntry,
				'level' | 'emotion' | 'secondaryEmotions' | 'activity' | 'withWhom' | 'notes' | 'tags'
			>
		>
	) {
		const wrapped = await encryptRecord('moodEntries', { ...patch });
		await moodEntryTable.update(id, {
			...wrapped,
		});
	},

	async deleteEntry(id: string) {
		await moodEntryTable.update(id, { deletedAt: new Date().toISOString() });
	},

	async updateSettings(
		patch: Partial<Pick<LocalMoodSettings, 'dailyTarget' | 'reminderTimes' | 'remindersEnabled'>>
	) {
		const existing = (await moodSettingsTable.toArray()).find((s) => !s.deletedAt);
		if (existing) {
			await moodSettingsTable.update(existing.id, { ...patch });
			return;
		}
		const newLocal: LocalMoodSettings = {
			id: crypto.randomUUID(),
			...DEFAULT_MOOD_SETTINGS,
			...patch,
		};
		await moodSettingsTable.add(newLocal);
	},
};
