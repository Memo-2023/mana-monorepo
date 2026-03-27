/**
 * Guest seed data for the Presi app.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They serve as onboarding content that teaches the user how the app works.
 */

import type { LocalDeck, LocalSlide } from './local-store';

const ONBOARDING_DECK_ID = 'onboarding-deck';

export const guestDecks: LocalDeck[] = [
	{
		id: ONBOARDING_DECK_ID,
		title: 'Willkommen bei Presi',
		description: 'Eine kurze Einführung in die Präsentations-App.',
		isPublic: false,
	},
];

export const guestSlides: LocalSlide[] = [
	{
		id: 'slide-1',
		deckId: ONBOARDING_DECK_ID,
		order: 1,
		content: {
			type: 'title',
			title: 'Willkommen bei Presi!',
			subtitle: 'Erstelle Präsentationen direkt im Browser.',
		},
	},
	{
		id: 'slide-2',
		deckId: ONBOARDING_DECK_ID,
		order: 2,
		content: {
			type: 'content',
			title: 'So funktioniert es',
			bulletPoints: [
				'Erstelle Decks mit dem + Button',
				'Füge Slides mit Text, Bildern und Aufzählungen hinzu',
				'Starte die Präsentation mit dem Play-Button',
				'Melde dich an, um zu synchronisieren',
			],
		},
	},
	{
		id: 'slide-3',
		deckId: ONBOARDING_DECK_ID,
		order: 3,
		content: {
			type: 'content',
			title: 'Tastaturkürzel',
			bulletPoints: [
				'Pfeiltasten / A+D — Slides navigieren',
				'F — Vollbild',
				'ESC — Präsentation beenden',
				'T — Themes öffnen',
			],
		},
	},
];
