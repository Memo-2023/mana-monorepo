import type { Mood, MoodSettings } from '$lib/types/mood';

// Default settings
const DEFAULT_SETTINGS: MoodSettings = {
	animationSpeed: 'normal',
	brightness: 100,
	autoTimer: 0,
	autoMoodSwitch: false,
	autoMoodSwitchInterval: 5,
};

// Moods store using Svelte 5 runes
function createMoodsStore() {
	let customMoods = $state<Mood[]>([]);
	let favoriteIds = $state<string[]>([]);
	let settings = $state<MoodSettings>({ ...DEFAULT_SETTINGS });
	let activeMood = $state<Mood | null>(null);

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

	// Save to localStorage
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

		// Check if a mood is a favorite
		isFavorite(moodId: string): boolean {
			return favoriteIds.includes(moodId);
		},

		setActiveMood(mood: Mood | null) {
			activeMood = mood;
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
			// Also remove from favorites
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
		},

		addToFavorites(moodId: string) {
			if (!favoriteIds.includes(moodId)) {
				favoriteIds = [...favoriteIds, moodId];
				persist();
			}
		},

		removeFromFavorites(moodId: string) {
			favoriteIds = favoriteIds.filter((id) => id !== moodId);
			persist();
		},

		updateSettings(updates: Partial<MoodSettings>) {
			settings = { ...settings, ...updates };
			persist();
		},

		resetToDefaults() {
			customMoods = [];
			favoriteIds = [];
			settings = { ...DEFAULT_SETTINGS };
			persist();
		},
	};
}

export const moodsStore = createMoodsStore();
