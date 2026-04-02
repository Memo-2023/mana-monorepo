/**
 * Guides App — Local-First Data Layer
 *
 * 5 Collections: guides, sections, steps, collections, runs
 * All data lives in IndexedDB first, syncs to server in the background.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestGuides, guestSections, guestSteps, guestCollections } from './guest-seed.js';

// ─── Types ──────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type StepType = 'instruction' | 'warning' | 'tip' | 'checkpoint' | 'code';

export interface LocalGuide extends BaseRecord {
	title: string;
	description?: string;
	/** Single emoji used as cover when no image */
	coverEmoji?: string;
	/** Tailwind-compatible hex color for the cover background */
	coverColor?: string;
	category: string;
	difficulty: Difficulty;
	estimatedMinutes?: number;
	tags: string[];
	/** Optional: belongs to a collection */
	collectionId?: string;
	orderInCollection?: number;
	/** Optional skilltree integration */
	xpReward?: number;
	skillId?: string;
}

export interface LocalSection extends BaseRecord {
	guideId: string;
	title: string;
	order: number;
}

export interface LocalStep extends BaseRecord {
	guideId: string;
	sectionId?: string;
	order: number;
	title: string;
	/** Markdown content */
	content?: string;
	type: StepType;
	checkable: boolean;
}

export interface LocalCollection extends BaseRecord {
	title: string;
	description?: string;
	coverEmoji?: string;
	coverColor?: string;
	/** path = ordered learning path, library = unordered recipe book */
	type: 'path' | 'library';
	/** Ordered guide IDs (relevant for 'path' type) */
	guideOrder: string[];
}

export interface StepState {
	done: boolean;
	doneAt?: string;
	notes?: string;
}

export interface LocalRun extends BaseRecord {
	guideId: string;
	startedAt: string;
	completedAt?: string;
	/** scroll = all steps visible, focus = one step at a time */
	mode: 'scroll' | 'focus';
	stepStates: Record<string, StepState>;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const guidesStore = createLocalStore({
	appId: 'guides',
	collections: [
		{
			name: 'guides',
			indexes: ['category', 'difficulty', 'collectionId', 'tags'],
			guestSeed: guestGuides,
		},
		{
			name: 'sections',
			indexes: ['guideId', 'order'],
			guestSeed: guestSections,
		},
		{
			name: 'steps',
			indexes: ['guideId', 'sectionId', 'order', '[guideId+order]'],
			guestSeed: guestSteps,
		},
		{
			name: 'collections',
			indexes: [],
			guestSeed: guestCollections,
		},
		{
			name: 'runs',
			indexes: ['guideId', 'startedAt', 'completedAt'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const guideCollection = guidesStore.collection<LocalGuide>('guides');
export const sectionCollection = guidesStore.collection<LocalSection>('sections');
export const stepCollection = guidesStore.collection<LocalStep>('steps');
export const collectionCollection = guidesStore.collection<LocalCollection>('collections');
export const runCollection = guidesStore.collection<LocalRun>('runs');
