/**
 * Moods mutation store — write operations for the unified DB.
 */

import { db } from '$lib/data/database';
import { MoodlitEvents } from '@mana/shared-utils/analytics';
import { createBlock, updateBlock } from '$lib/data/time-blocks/service';
import type { LocalMood } from '../types';
import type { Mood, MoodSettings } from '../types';

// Default settings
const DEFAULT_SETTINGS: MoodSettings = {
	animationSpeed: 'normal',
	brightness: 100,
	autoTimer: 0,
	autoMoodSwitch: false,
	autoMoodSwitchInterval: 5,
};

function createMoodsStore() {
	let customMoods = $state<Mood[]>([]);
	let favoriteIds = $state<string[]>([]);
	let settings = $state<MoodSettings>({ ...DEFAULT_SETTINGS });
	let activeMood = $state<Mood | null>(null);
	let activeSessionBlockId = $state<string | null>(null);

	// Load from localStorage on init
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('moodlit-store');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (parsed.customMoods) customMoods = parsed.customMoods;
				if (parsed.favoriteIds) favoriteIds = parsed.favoriteIds;
				if (parsed.settings) settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
			} catch (e) {
				console.error('Failed to load moods from localStorage', e);
			}
		}
	}

	function persist() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('moodlit-store', JSON.stringify({ customMoods, favoriteIds, settings }));
		}
	}

	return {
		get customMoods() {
			return customMoods;
		},
		get favoriteIds() {
			return favoriteIds;
		},
		get settings() {
			return settings;
		},
		get activeMood() {
			return activeMood;
		},

		isFavorite(moodId: string): boolean {
			return favoriteIds.includes(moodId);
		},

		setActiveMood(mood: Mood | null) {
			activeMood = mood;
		},

		async startMoodSession(mood: Mood): Promise<void> {
			if (activeSessionBlockId) {
				await updateBlock(activeSessionBlockId, {
					endDate: new Date().toISOString(),
				});
			}
			activeSessionBlockId = await createBlock({
				startDate: new Date().toISOString(),
				endDate: null,
				isLive: true,
				kind: 'logged',
				type: 'mood',
				sourceModule: 'moodlit',
				sourceId: mood.id,
				title: mood.name,
				color: mood.colors?.[0] ?? '#fb923c',
			});
		},

		async endMoodSession(): Promise<void> {
			if (!activeSessionBlockId) return;
			await updateBlock(activeSessionBlockId, {
				endDate: new Date().toISOString(),
				isLive: false,
			});
			activeSessionBlockId = null;
		},

		addMood(mood: Mood) {
			customMoods = [...customMoods, mood];
			persist();
		},

		updateMood(id: string, updates: Partial<Mood>) {
			customMoods = customMoods.map((m) => (m.id === id ? { ...m, ...updates } : m));
			persist();
		},

		removeMood(id: string) {
			customMoods = customMoods.filter((m) => m.id !== id);
			favoriteIds = favoriteIds.filter((fid) => fid !== id);
			persist();
		},

		toggleFavorite(moodId: string) {
			if (favoriteIds.includes(moodId)) {
				favoriteIds = favoriteIds.filter((id) => id !== moodId);
			} else {
				favoriteIds = [...favoriteIds, moodId];
			}
			persist();
			MoodlitEvents.moodFavorited();
		},

		updateSettings(updates: Partial<MoodSettings>) {
			settings = { ...settings, ...updates };
			persist();
		},

		// IndexedDB mutation methods
		async createMood(data: { name: string; colors: string[]; animation: string }) {
			await db.table<LocalMood>('moods').add({
				id: crypto.randomUUID(),
				name: data.name,
				colors: data.colors,
				animation: data.animation,
				isDefault: false,
				createdAt: new Date().toISOString(),
			});
			MoodlitEvents.moodCreated();
		},

		async deleteMood(id: string) {
			await db.table('moods').update(id, {
				deletedAt: new Date().toISOString(),
			});
			MoodlitEvents.moodDeleted();
		},
	};
}

export const moodsStore = createMoodsStore();
