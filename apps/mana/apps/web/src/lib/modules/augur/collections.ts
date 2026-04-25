import { db } from '$lib/data/database';
import type { LocalAugurEntry } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const augurEntriesTable = db.table<LocalAugurEntry>('augurEntries');

// ─── Guest Seed ────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

export const AUGUR_GUEST_SEED = {
	augurEntries: [
		{
			id: 'augur-welcome-omen',
			kind: 'omen',
			source: 'Doppelter Regenbogen am Morgen',
			sourceCategory: 'natural',
			claim: 'Ein guter Tag steht bevor.',
			vibe: 'good',
			feltMeaning: 'Vielleicht das Zeichen, dass das Projekt heute Fortschritt bringt.',
			expectedOutcome: 'Heute kommt eine gute Nachricht zum Projekt.',
			expectedBy: today,
			probability: null,
			outcome: 'fulfilled',
			outcomeNote: 'Tatsächlich kam die Zusage.',
			resolvedAt: today,
			encounteredAt: yesterday,
			tags: ['arbeit', 'naturzeichen'],
			relatedDreamId: null,
			relatedDecisionId: null,
			livingOracleSnapshot: null,
			isPrivate: true,
			isArchived: false,
		},
		{
			id: 'augur-welcome-fortune',
			kind: 'fortune',
			source: 'Glückskeks gestern Abend',
			sourceCategory: 'fortune-cookie',
			claim: 'Der nächste Schritt führt dich weiter, als du denkst.',
			vibe: 'mysterious',
			feltMeaning: null,
			expectedOutcome: null,
			expectedBy: null,
			probability: null,
			outcome: 'open',
			outcomeNote: null,
			resolvedAt: null,
			encounteredAt: lastWeek,
			tags: ['fortune-cookie'],
			relatedDreamId: null,
			relatedDecisionId: null,
			livingOracleSnapshot: null,
			isPrivate: true,
			isArchived: false,
		},
		{
			id: 'augur-welcome-hunch',
			kind: 'hunch',
			source: 'Bauchgefühl beim Lesen der Mail',
			sourceCategory: 'gut',
			claim: 'Diese Anfrage bringt mehr Arbeit als sie wert ist.',
			vibe: 'bad',
			feltMeaning: 'Sollte freundlich, aber bestimmt absagen.',
			expectedOutcome: 'Wenn ich annehme, verbringe ich >5h damit.',
			expectedBy: null,
			probability: 0.7,
			outcome: 'open',
			outcomeNote: null,
			resolvedAt: null,
			encounteredAt: today,
			tags: ['arbeit'],
			relatedDreamId: null,
			relatedDecisionId: null,
			livingOracleSnapshot: null,
			isPrivate: true,
			isArchived: false,
		},
	] satisfies LocalAugurEntry[],
};
