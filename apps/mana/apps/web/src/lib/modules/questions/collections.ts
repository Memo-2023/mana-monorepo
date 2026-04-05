/**
 * Questions module — collection accessors and guest seed data.
 *
 * Uses prefixed table names in the unified DB: qCollections, questions, answers.
 */

import { db } from '$lib/data/database';
import type { LocalCollection, LocalQuestion, LocalAnswer } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const qCollectionTable = db.table<LocalCollection>('qCollections');
export const questionTable = db.table<LocalQuestion>('questions');
export const answerTable = db.table<LocalAnswer>('answers');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_COLLECTION_ID = 'demo-research';

export const QUESTIONS_GUEST_SEED = {
	qCollections: [
		{
			id: DEMO_COLLECTION_ID,
			name: 'Erste Recherche',
			description: 'Beispiel-Sammlung zum Kennenlernen.',
			color: '#6366f1',
			icon: 'search',
			isDefault: true,
			sortOrder: 0,
		},
	],
	questions: [
		{
			id: 'q-1',
			collectionId: DEMO_COLLECTION_ID,
			title: 'Was ist Local-First Software?',
			description: 'Wie funktioniert der Ansatz und welche Vorteile hat er?',
			status: 'open' as const,
			priority: 'normal' as const,
			tags: ['tech', 'architektur'],
			researchDepth: 'standard' as const,
		},
		{
			id: 'q-2',
			collectionId: DEMO_COLLECTION_ID,
			title: 'Welche Datenbanken eignen sich für Offline-First Apps?',
			description: null,
			status: 'open' as const,
			priority: 'normal' as const,
			tags: ['tech', 'datenbank'],
			researchDepth: 'quick' as const,
		},
	],
	answers: [] as Array<Record<string, unknown>>,
};
