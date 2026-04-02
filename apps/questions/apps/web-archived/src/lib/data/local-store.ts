/**
 * Questions — Local-First Data Layer
 *
 * Questions, collections, and answers stored locally.
 * Research (via mana-search) remains server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestCollections, guestQuestions } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalCollection extends BaseRecord {
	name: string;
	description?: string | null;
	color: string;
	icon: string;
	isDefault: boolean;
	sortOrder: number;
}

export interface LocalQuestion extends BaseRecord {
	collectionId?: string | null;
	title: string;
	description?: string | null;
	status: 'open' | 'researching' | 'answered' | 'archived';
	priority: 'low' | 'normal' | 'high' | 'urgent';
	tags: string[];
	researchDepth: 'quick' | 'standard' | 'deep';
}

export interface LocalAnswer extends BaseRecord {
	questionId: string;
	researchResultId?: string | null;
	content: string;
	citations: Array<{ sourceId: string; text: string }>;
	rating?: number | null;
	isAccepted: boolean;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const questionsAppStore = createLocalStore({
	appId: 'questions',
	collections: [
		{
			name: 'collections',
			indexes: ['sortOrder', 'isDefault'],
			guestSeed: guestCollections,
		},
		{
			name: 'questions',
			indexes: ['collectionId', 'status', 'priority', '[collectionId+status]'],
			guestSeed: guestQuestions,
		},
		{
			name: 'answers',
			indexes: ['questionId', 'isAccepted'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const collectionCollection = questionsAppStore.collection<LocalCollection>('collections');
export const questionCollection = questionsAppStore.collection<LocalQuestion>('questions');
export const answerCollection = questionsAppStore.collection<LocalAnswer>('answers');
