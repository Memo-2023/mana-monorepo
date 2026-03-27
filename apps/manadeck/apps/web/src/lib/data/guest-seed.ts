/**
 * Guest seed data for the ManaDeck app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They serve as onboarding content that teaches the user how the app works.
 */

import type { LocalDeck, LocalCard } from './local-store';

const ONBOARDING_DECK_ID = 'onboarding-deck';

export const guestDecks: LocalDeck[] = [
	{
		id: ONBOARDING_DECK_ID,
		name: 'Erste Schritte',
		description: 'Lerne ManaDeck kennen mit diesen Beispiel-Karteikarten.',
		color: '#6366f1',
		cardCount: 3,
		isPublic: false,
	},
];

export const guestCards: LocalCard[] = [
	{
		id: 'card-1',
		deckId: ONBOARDING_DECK_ID,
		front: 'Was ist ManaDeck?',
		back: 'ManaDeck ist eine Karteikarten-App zum effizienten Lernen mit Spaced Repetition.',
		difficulty: 1,
		reviewCount: 0,
		order: 0,
	},
	{
		id: 'card-2',
		deckId: ONBOARDING_DECK_ID,
		front: 'Wie funktioniert Spaced Repetition?',
		back: 'Karten, die du gut kennst, werden seltener gezeigt. Schwierige Karten erscheinen häufiger, bis du sie beherrschst.',
		difficulty: 2,
		reviewCount: 0,
		order: 1,
	},
	{
		id: 'card-3',
		deckId: ONBOARDING_DECK_ID,
		front: 'Wie erstelle ich ein neues Deck?',
		back: 'Klicke auf den + Button auf der Decks-Seite, um ein neues Deck mit eigenen Karteikarten zu erstellen.',
		difficulty: 1,
		reviewCount: 0,
		order: 2,
	},
];
