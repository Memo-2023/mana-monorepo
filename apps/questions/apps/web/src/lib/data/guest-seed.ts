/**
 * Guest seed data for the Questions app.
 *
 * Provides demo collections and questions for the onboarding experience.
 */

import type { LocalCollection, LocalQuestion } from './local-store';

const DEMO_COLLECTION_ID = 'demo-research';

export const guestCollections: LocalCollection[] = [
	{
		id: DEMO_COLLECTION_ID,
		name: 'Erste Recherche',
		description: 'Beispiel-Sammlung zum Kennenlernen.',
		color: '#6366f1',
		icon: 'search',
		isDefault: true,
		sortOrder: 0,
	},
];

export const guestQuestions: LocalQuestion[] = [
	{
		id: 'q-1',
		collectionId: DEMO_COLLECTION_ID,
		title: 'Was ist Local-First Software?',
		description: 'Wie funktioniert der Ansatz und welche Vorteile hat er?',
		status: 'open',
		priority: 'normal',
		tags: ['tech', 'architektur'],
		researchDepth: 'standard',
	},
	{
		id: 'q-2',
		collectionId: DEMO_COLLECTION_ID,
		title: 'Welche Datenbanken eignen sich für Offline-First Apps?',
		status: 'open',
		priority: 'normal',
		tags: ['tech', 'datenbank'],
		researchDepth: 'quick',
	},
];
