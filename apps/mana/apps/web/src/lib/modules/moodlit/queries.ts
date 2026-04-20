/**
 * Reactive queries for Moodlit — uses Dexie liveQuery on the unified DB.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalMood, LocalSequence, Mood } from './types';

// ─── Helpers ──────────────────────────────────────────────

/** Get gradient CSS for a mood. */
export function getMoodGradient(mood: Mood): string {
	if (mood.colors.length === 1) {
		return mood.colors[0];
	}
	return `linear-gradient(135deg, ${mood.colors.join(', ')})`;
}

/** Get mood by ID from a list. */
export function getMoodById(moods: Mood[], id: string): Mood | undefined {
	return moods.find((m) => m.id === id);
}

// ─── Live Queries ──────────────────────────────────────────

/** All moods, sorted by name. */
export function useAllMoods() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalMood, string>('moodlit', 'moods').toArray();
		return locals.filter((m) => !m.deletedAt);
	}, []);
}

/** All sequences, sorted by name. */
export function useAllSequences() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalSequence, string>('moodlit', 'sequences').toArray();
		return locals.filter((s) => !s.deletedAt);
	}, []);
}
