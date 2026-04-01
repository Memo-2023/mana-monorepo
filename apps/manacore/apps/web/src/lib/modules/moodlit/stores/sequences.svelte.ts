/**
 * Sequences mutation store — write operations for the unified DB.
 */

import { db } from '$lib/data/database';
import type { LocalSequence } from '../types';
import type { MoodSequence } from '../types';

// Default sequences for demo purposes
const DEFAULT_SEQUENCES: MoodSequence[] = [
	{
		id: 'relaxation',
		name: 'Relaxation',
		items: [
			{ moodId: 'breath', duration: 60 },
			{ moodId: 'ocean', duration: 60 },
			{ moodId: 'lavender', duration: 60 },
		],
		transitionDuration: 5,
	},
	{
		id: 'focus',
		name: 'Focus Flow',
		items: [
			{ moodId: 'forest', duration: 120 },
			{ moodId: 'northern-lights', duration: 120 },
		],
		transitionDuration: 10,
	},
	{
		id: 'party',
		name: 'Party Mode',
		items: [
			{ moodId: 'disco', duration: 30 },
			{ moodId: 'rave', duration: 30 },
			{ moodId: 'police', duration: 15 },
		],
		transitionDuration: 2,
	},
];

function createSequencesStore() {
	let sequences = $state<MoodSequence[]>([...DEFAULT_SEQUENCES]);
	let customSequences = $state<MoodSequence[]>([]);
	let activeSequence = $state<MoodSequence | null>(null);
	let currentItemIndex = $state(0);
	let isPlaying = $state(false);

	// Load from localStorage on init
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('moodlit-sequences');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				if (parsed.customSequences) customSequences = parsed.customSequences;
			} catch (e) {
				console.error('Failed to load sequences from localStorage', e);
			}
		}
	}

	function persist() {
		if (typeof window !== 'undefined') {
			localStorage.setItem('moodlit-sequences', JSON.stringify({ customSequences }));
		}
	}

	return {
		get sequences() {
			return [...sequences, ...customSequences];
		},
		get customSequences() {
			return customSequences;
		},
		get activeSequence() {
			return activeSequence;
		},
		get currentItemIndex() {
			return currentItemIndex;
		},
		get isPlaying() {
			return isPlaying;
		},

		addSequence(sequence: MoodSequence) {
			customSequences = [...customSequences, { ...sequence, isCustom: true }];
			persist();
		},

		updateSequence(id: string, updates: Partial<MoodSequence>) {
			customSequences = customSequences.map((s) => (s.id === id ? { ...s, ...updates } : s));
			persist();
		},

		removeSequence(id: string) {
			customSequences = customSequences.filter((s) => s.id !== id);
			persist();
		},

		playSequence(sequence: MoodSequence) {
			activeSequence = sequence;
			currentItemIndex = 0;
			isPlaying = true;
		},

		stopSequence() {
			activeSequence = null;
			currentItemIndex = 0;
			isPlaying = false;
		},

		nextItem() {
			if (activeSequence && currentItemIndex < activeSequence.items.length - 1) {
				currentItemIndex++;
			} else {
				currentItemIndex = 0;
			}
		},

		previousItem() {
			if (currentItemIndex > 0) {
				currentItemIndex--;
			}
		},

		togglePlay() {
			isPlaying = !isPlaying;
		},

		// IndexedDB mutation methods
		async createSequence(data: { name: string; moodIds: string[]; duration: number }) {
			await db.table<LocalSequence>('sequences').add({
				id: crypto.randomUUID(),
				name: data.name,
				moodIds: data.moodIds,
				duration: data.duration,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		},

		async deleteSequence(id: string) {
			await db.table('sequences').update(id, {
				deletedAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			});
		},
	};
}

export const sequencesStore = createSequencesStore();
