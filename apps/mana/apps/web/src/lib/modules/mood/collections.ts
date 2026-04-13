/**
 * Mood module — collection accessors. No seed data needed (entries are user-created).
 */

import { db } from '$lib/data/database';
import type { LocalMoodEntry, LocalMoodSettings } from './types';

export const moodEntryTable = db.table<LocalMoodEntry>('moodEntries');
export const moodSettingsTable = db.table<LocalMoodSettings>('moodSettings');

export const MOOD_GUEST_SEED = {
	moodEntries: [] satisfies LocalMoodEntry[],
	moodSettings: [] satisfies LocalMoodSettings[],
};
