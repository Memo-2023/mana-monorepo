/**
 * Presi module — collection accessors and guest seed data.
 *
 * Uses prefixed table names in the unified DB: presiDecks, slides.
 */

import { db } from '$lib/data/database';
import type { LocalDeck, LocalSlide } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const presiDeckTable = db.table<LocalDeck>('presiDecks');
export const slideTable = db.table<LocalSlide>('slides');

// ─── Guest Seed ────────────────────────────────────────────

const ONBOARDING_DECK_ID = 'onboarding-deck';

export const PRESI_GUEST_SEED = {
	presiDecks: [
		{
			id: ONBOARDING_DECK_ID,
			title: 'Willkommen bei Presi',
			description: 'Eine kurze Einfuhrung in die Prasentations-App.',
		},
	],
	slides: [
		{
			id: 'slide-1',
			deckId: ONBOARDING_DECK_ID,
			order: 1,
			content: {
				type: 'title' as const,
				title: 'Willkommen bei Presi!',
				subtitle: 'Erstelle Prasentationen direkt im Browser.',
			},
		},
		{
			id: 'slide-2',
			deckId: ONBOARDING_DECK_ID,
			order: 2,
			content: {
				type: 'content' as const,
				title: 'So funktioniert es',
				bulletPoints: [
					'Erstelle Decks mit dem + Button',
					'Fuge Slides mit Text, Bildern und Aufzahlungen hinzu',
					'Starte die Prasentation mit dem Play-Button',
					'Melde dich an, um zu synchronisieren',
				],
			},
		},
		{
			id: 'slide-3',
			deckId: ONBOARDING_DECK_ID,
			order: 3,
			content: {
				type: 'content' as const,
				title: 'Tastaturkurzel',
				bulletPoints: [
					'Pfeiltasten / A+D — Slides navigieren',
					'F — Vollbild',
					'ESC — Prasentation beenden',
				],
			},
		},
	],
};
